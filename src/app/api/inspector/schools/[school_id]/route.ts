import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ school_id: string }> },
) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "inspector") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { school_id } = await params;

  try {
    const result = await pool.query(
      `SELECT
         lab_status,
         library_status,
         academic_staff,
         non_academic_staff,
         board_members
       FROM schoolskano
       WHERE school_id = $1`,
      [school_id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Inspector school detail error:", err);
    return NextResponse.json({ error: "Failed to fetch school detail" }, { status: 500 });
  }
}
