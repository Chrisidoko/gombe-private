// src/app/api/schools/[school_id]/documents/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";

export async function GET(
  request: Request,
  context: { params: Promise<{ school_id: string }> }
) {
  try {
    const { school_id } = await context.params;

    const denied = await requireSchoolAccess(school_id);
    if (denied) return denied;

    const result = await pool.query(
      `SELECT id, school_id, document_type, file_url 
       FROM schoolkano_documents 
       WHERE school_id = $1
       ORDER BY document_type`,
      [school_id]
    );

    return NextResponse.json({
      documents: result.rows,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
