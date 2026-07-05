import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ school_id: string }> },
) {
  const { school_id } = await params;
  const decodedId = decodeURIComponent(school_id);

  try {
    const result = await pool.query(
      `SELECT
         id,
         inspector_name,
         inspector_email,
         lab_workshop_rating,
         lab_workshop_note,
         library_rating,
         library_note,
         academic_staff_rating,
         academic_staff_note,
         non_academic_staff_rating,
         non_academic_staff_note,
         visited_at
       FROM inspector_assessments
       WHERE school_id = $1
       ORDER BY visited_at DESC
       LIMIT 1`,
      [decodedId],
    );

    return NextResponse.json({
      assessment: result.rows[0] ?? null,
    });
  } catch (err) {
    console.error("Fetch latest assessment error:", err);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
