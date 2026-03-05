// app/api/finance/questionnaires/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
    SELECT
        d.id,
        d.school_id,
        d.document_type,
        d.file_url,
        d.uploaded_at,
        s.name AS school_name,
        s.lga,
        s.state,
        p.doc_approval
    FROM schoolkano_documents d
    LEFT JOIN schoolskano s ON s.school_id = d.school_id
    LEFT JOIN schoolkano_payments p 
        ON p.school_id = d.school_id AND p.fee_id = 4
    WHERE d.document_type = 'Application Form'
    ORDER BY d.uploaded_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Questionnaires fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaires" },
      { status: 500 },
    );
  }
}

// For document approval to app/api/schools/questionnaires/route.ts
export async function PATCH(req: Request) {
  try {
    const { school_id } = await req.json();

    if (!school_id) {
      return NextResponse.json(
        { error: "school_id is required" },
        { status: 400 },
      );
    }

    await pool.query(
      `UPDATE schoolkano_payments
       SET doc_approval = 'approved'
       WHERE school_id = $1 AND fee_id = 4`,
      [school_id],
    );

    return NextResponse.json({ success: true, message: "Document approved" });
  } catch (error) {
    console.error("Approval failed:", error);
    return NextResponse.json(
      { error: "Failed to approve document" },
      { status: 500 },
    );
  }
}
