// app/api/admin/create-school/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateSchoolID } from "@/lib/generateSchoolID";
import { getUserFromCookie } from "@/lib/auth";
import { findLGA, findCategory } from "@/lib/schoolIdConstants";

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

    const officialName = name.trim();
    const school_id = await generateSchoolID(lga, category);
    const email = generateEmail(officialName);
    const plainPassword = "Password@123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await pool.query("BEGIN");

    try {
      // 1. Insert into schoolskano
      await pool.query(
        `INSERT INTO schoolskano (school_id, name, email, enumerator_name, state, lga, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [school_id, officialName, email, enumeratorName, "Gombe", lga, category],
      );

      // 2. Insert into userskano
      await pool.query(
        `INSERT INTO userskano (institution, email,  password_hash, is_verified, status, name)
   VALUES ($1, $2, $3, $4, $5, $6)`,
        [school_id, email, hashedPassword, true, "approved", "SCHOOL ADMIN"],
      );

      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

    return NextResponse.json({
      message: "School created successfully",
      school_id,
      email,
      password: plainPassword, // returned so admin can see it once
    });
  } catch (error) {
    console.error("Create school failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
