import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "inspector") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    school_id,
    school_name,
    lab_workshop_rating,
    lab_workshop_note,
    library_rating,
    library_note,
    academic_staff_rating,
    academic_staff_note,
    non_academic_staff_rating,
    non_academic_staff_note,
  } = body;

  if (!school_id || !school_name) {
    return NextResponse.json({ error: "Missing school information" }, { status: 400 });
  }

  const hasAnyRating =
    lab_workshop_rating || library_rating ||
    academic_staff_rating || non_academic_staff_rating;

  if (!hasAnyRating) {
    return NextResponse.json({ error: "At least one rating is required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inspector_assessments
        (school_id, school_name, inspector_name, inspector_email,
         lab_workshop_rating, lab_workshop_note,
         library_rating, library_note,
         academic_staff_rating, academic_staff_note,
         non_academic_staff_rating, non_academic_staff_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, visited_at`,
      [
        school_id, school_name, user.name, user.email,
        lab_workshop_rating    || null, lab_workshop_note     || null,
        library_rating         || null, library_note          || null,
        academic_staff_rating  || null, academic_staff_note   || null,
        non_academic_staff_rating || null, non_academic_staff_note || null,
      ]
    );

    return NextResponse.json({ assessment: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Assessment insert error:", err);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
