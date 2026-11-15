// app/api/admin/create-school/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateSchoolID } from "@/lib/generateSchoolID";
import { getUserFromCookie } from "@/lib/auth";
import { findLGA, findCategory } from "@/lib/schoolIdConstants";
import { requireRole } from "@/lib/apiAuth";

function generateEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("");
  return `${slug}@gesms.edu.ng`;
}

export async function POST(req: Request) {
  const denied = await requireRole("CBS_Admin", "CBS_Inspector");
  if (denied) return denied;

  try {
    const user = await getUserFromCookie();
    const enumeratorName = user?.name ?? null;

    const { name, lga, category } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "School name is required" },
        { status: 400 },
      );
    }

    if (!lga || !findLGA(lga)) {
      return NextResponse.json({ error: "Valid LGA is required" }, { status: 400 });
    }

    if (!category || !findCategory(category)) {
      return NextResponse.json(
        { error: "Valid school category is required" },
        { status: 400 },
      );
    }

    const officialName = name.trim().replace(/\s+/g, " ");

    // Same name ignoring case and extra spaces counts as the same school
    const existing = await pool.query(
      `SELECT school_id, name, lga FROM schoolskano
       WHERE lower(regexp_replace(trim(name), '\\s+', ' ', 'g')) = lower($1)
       LIMIT 1`,
      [officialName],
    );
    if (existing.rows.length > 0) {
      const school = existing.rows[0];
      return NextResponse.json(
        {
          error: `"${school.name}" already exists (School ID ${school.school_id}${school.lga ? `, ${school.lga} LGA` : ""}). Search for it instead of creating it again.`,
        },
        { status: 409 },
      );
    }

    const school_id = await generateSchoolID(lga, category);
    // Different schools can share their first three words, so number the
    // login email when the plain one is taken
    const baseEmail = generateEmail(officialName);
    const taken = await pool.query(
      `SELECT lower(email) AS email FROM userskano WHERE lower(email) LIKE $1`,
      [baseEmail.replace("@", "%@")],
    );
    const takenEmails = new Set(taken.rows.map((r) => r.email));
    let email = baseEmail;
    for (let n = 2; takenEmails.has(email); n++) {
      email = baseEmail.replace("@", `${n}@`);
    }
    const plainPassword = "Password@123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // One client for the whole transaction, so a failed login insert also
    // undoes the school insert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert into schoolskano
      await client.query(
        `INSERT INTO schoolskano (school_id, name, email, enumerator_name, state, lga, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [school_id, officialName, email, enumeratorName, "Gombe", lga, category],
      );

      // 2. Insert into userskano
      await client.query(
        `INSERT INTO userskano (institution, email,  password_hash, is_verified, status, name)
   VALUES ($1, $2, $3, $4, $5, $6)`,
        [school_id, email, hashedPassword, true, "approved", "SCHOOL ADMIN"],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      message: "School created successfully",
      school_id,
      email,
      password: plainPassword, // returned so admin can see it once
    });
  } catch (error) {
    console.error("Create school failed:", error);
    // Two people creating the same school at the same moment
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        {
          error:
            "This school was just created by someone else. Search for it instead of creating it again.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not create the school. Please try again." },
      { status: 500 },
    );
  }
}
