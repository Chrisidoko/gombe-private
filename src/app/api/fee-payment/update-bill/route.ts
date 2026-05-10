// app/api/fee-payment/update-bill/route.ts
// This route is called by the payment gateway (PayKaduna) after a payment attempt, to update the invoice status in our database based on the payment outcome.
// I don't Think i am using this route anymore, but I am keeping it here for now just in case. It can be deleted later if i confirm it's not needed.
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoice_number, amount, status, payment_reference, payment_item } =
      body;

    if (!invoice_number || !amount || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await pool.connect();

    // Update the invoice table
    const updateQuery = `
      UPDATE schoolkano_payments
      SET status = $1,
          reference = $2,
          paid_at = NOW(),
          amount = $3
      WHERE invoice_number = $4
      RETURNING *;
    `;
    const { rows } = await client.query(updateQuery, [
      status,
      payment_reference,
      amount,
      invoice_number,
    ]);

    //  insert into a transactions log
    const transactionQuery = `
      INSERT INTO transactionskano (invoice_number, reference, amount, status, payment_item)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await client.query(transactionQuery, [
      invoice_number,
      payment_reference,
      amount,
      status,
      payment_item,
    ]);

    client.release();

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      invoice: rows[0],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Invoice update error:", message);
    return NextResponse.json(
      { error: "Failed to update invoice", details: message },
      { status: 500 },
    );
  }
}
