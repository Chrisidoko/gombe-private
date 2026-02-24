// app/api/invoices/create-invoice/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start transaction

    const { school_id, amount } = await req.json();

    if (!school_id || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const invoice_number = `INV-${school_id}-${Date.now()}`;

    // Step 1: Create invoice in database
    const query = `
      INSERT INTO schoolkano_invoices 
      (school_id, invoice_number, amount, status, issue_date, due_date)
      VALUES ($1, $2, $3, 'Unpaid', NOW(), NOW() + INTERVAL '14 days')
      RETURNING id, invoice_number, due_date;
    `;

    const values = [school_id, invoice_number, amount];
    const result = await client.query(query, values);
    const invoiceId = result.rows[0].id;

    // console.log("✅ Invoice created:", result.rows[0]);

    // Step 2: Fetch school info
    const schoolRes = await client.query(
      "SELECT email, name, phone, address FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (schoolRes.rows.length === 0) {
      throw new Error("School not found");
    }

    const school = schoolRes.rows[0];
    console.log("🏫 School found:", school);

    // Step 3: Create bill with 3rd party API
    let billReference = null;
    let billStatus = null;
    let tpui = null;

    try {
      // Parse the school name into parts
      const nameParts = school.name.split(" ");
      const firstName = nameParts[0] || school.name;
      const middleName = nameParts[1] || "";
      const lastName =
        nameParts.length > 2 ? nameParts.slice(2).join(" ") : nameParts[0];

      const billPayload = {
        engineCode: process.env.PAYKADUNA_ENGINE_CODE,
        identifier: invoice_number,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        address: school.address || "Kaduna, Nigeria",
        telephone: school.phone || "08000000000",
        esBillDetailsDto: [
          {
            amount: parseFloat(amount),
            mdasId: parseInt(process.env.MDAS_ID || "3646"),
            narration: `School License Renewal - ${invoice_number}`,
          },
        ],
      };

      const jsonPayload = JSON.stringify(billPayload);

      // Generate HMAC SHA256 signature
      const apiKey = process.env.PAYKADUNA_API_KEY;
      if (!apiKey) {
        throw new Error("Third party API key not configured");
      }

      const signature = crypto
        .createHmac("sha256", apiKey)
        .update(jsonPayload)
        .digest("base64");

      console.log("🔹 Creating bill with 3rd party API...");

      const apiUrl = `${process.env.NEXT_PUBLIC_PAYKADUNA_URL}api/ESBills/CreateESBill`;

      const billResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Signature": signature,
        },
        body: jsonPayload,
      });

      if (!billResponse.ok) {
        const errorData = await billResponse.text();
        console.error("3rd party API error:", errorData);
        throw new Error(`Bill creation failed: ${billResponse.statusText}`);
      }

      const billData = await billResponse.json();
      // console.log("✅ Bill created:", billData);

      // Extract billReference and status from response
      billReference = billData.bill?.billReference || invoice_number;
      billStatus = billData.bill?.payStatus || "Unpaid";
      tpui = billData.bill?.tpui || "";

      // Step 4: Update invoice with bill reference
      await client.query(
        `UPDATE schoolkano_invoices 
         SET bill_reference = $1, status = $2, tpui = $3, updated_at = NOW() 
         WHERE id = $4`,
        [billReference, billStatus, tpui, invoiceId],
      );
      // console.log("✅ Invoice updated with bill reference");
    } catch (billError) {
      console.error("Bill creation failed:", billError);
      // Rollback transaction if bill creation fails
      await client.query("ROLLBACK");
      throw billError;
    }

    // Commit transaction
    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      invoice_id: result.rows[0].id,
      invoice_number: result.rows[0].invoice_number,
      due_date: result.rows[0].due_date,
      bill_reference: billReference,
      status: billStatus,
    });
  } catch (error) {
    // Rollback on any error
    await client.query("ROLLBACK");

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Invoice creation error:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}
