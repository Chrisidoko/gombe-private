// api/schools/fees/upload-doc/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const { school_id, fee_id, document_url } = await req.json();

    if (!school_id || !fee_id) {
      return NextResponse.json(
        { error: "school_id and fee_id are required" },
        { status: 400 },
      );
    }

    await pool.query(
      `UPDATE schoolkano_payments 
       SET doc_approval = 'pending',
           document_url = $3
       WHERE school_id = $1 AND fee_id = $2`,
      [school_id, fee_id, document_url ?? null],
    );

    return NextResponse.json({
      message: "Document upload recorded successfully",
    });
  } catch (error) {
    console.error("Document update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
