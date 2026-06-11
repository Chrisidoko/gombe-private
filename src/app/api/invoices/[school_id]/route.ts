//This is specifically to fetch invoice by school_Id - PLEASE NOTE
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: Request,
  context: { params: Promise<{ school_id: string }> }
) {
  try {
    const { school_id } = await context.params; // 👈 awaited before use

    const query = `
      SELECT id, invoice_number, title, amount, status, issue_date, due_date
      FROM schoolkano_invoices
      WHERE school_id = $1
      ORDER BY issue_date DESC
    `;
    const { rows } = await pool.query(query, [school_id]);

    return NextResponse.json({ invoices: rows });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
