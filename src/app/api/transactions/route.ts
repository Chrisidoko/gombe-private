//This is specifically to fetch all schools typicaly for an admin
//api/transactions/[school_id]/route.ts
//This is specifically to fetch transactions by school_Id - PLEASE NOTE
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ school_id: string }> } // 👈 params as a Promise
) {
  try {
    const { school_id } = await context.params; // 👈 awaited before use

    const query = `
      SELECT id, reference, amount, status, payment_item, invoice_number, updated_at
      FROM transactionskano
      ORDER BY updated_at DESC
    `;
    const { rows } = await pool.query(query, [school_id]);

    return NextResponse.json({ invoices: rows });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions:" },
      { status: 500 }
    );
  }
}
