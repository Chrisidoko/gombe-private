// app/api/admin/create-school/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateSchoolID } from "@/lib/generateSchoolID";

function generateEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("");
  return `${slug}@kaptems.edu.ng`;
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "School name is required" },
        { status: 400 },
      );
    }

    const officialName = name.trim();
    const school_id = await generateSchoolID(officialName);
    const email = generateEmail(officialName);
    const plainPassword = "Password@123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await pool.query("BEGIN");

    try {
      // 1. Insert into schoolskano
      await pool.query(
        `INSERT INTO schoolskano (school_id, name, email)
         VALUES ($1, $2, $3)`,
        [school_id, officialName, email],
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
