import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { school_id, amount } = await req.json();

    if (!school_id || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const invoice_number = `INV-${school_id}-${Date.now()}`;

    const query = `
      INSERT INTO schoolkano_invoices 
      (school_id, invoice_number, amount, status, issue_date, due_date)
      VALUES ($1, $2, $3, 'unpaid', NOW(), NOW() + INTERVAL '14 days')
      RETURNING id, invoice_number, due_date;
    `;

    const values = [school_id, invoice_number, amount];
    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      invoice_id: result.rows[0].id,
      invoice_number: result.rows[0].invoice_number,
      due_date: result.rows[0].due_date,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Invoice creation error:", message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
