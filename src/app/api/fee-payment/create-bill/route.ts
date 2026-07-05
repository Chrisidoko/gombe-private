// app/api/fee-payment/create-bill/route.ts
// Currently not in use : take note

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start transaction

    const { school_id, amount, narration } = await req.json();

    if (!school_id || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // console.log(" Invoice created:", result.rows[0]);

    // Step 1: Fetch school info
    const schoolRes = await client.query(
      "SELECT email, name, phone, address FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (schoolRes.rows.length === 0) {
      throw new Error("School not found");
    }

    const school = schoolRes.rows[0];
    // console.log("🏫 School found:", school);

    // Step 2: Create bill with 3rd party API
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
        identifier: `${school_id}`, // Unique identifier for this bill --- stable per school, remains the same all through, allows idempotency per school
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        address: school.address || "Gombe, Nigeria",
        telephone: school.phone || "08000000000",
        esBillDetailsDto: [
          {
            amount: parseFloat(amount),
            mdasId: parseInt(process.env.MDAS_ID || "3654"),
            narration: `${narration} - Invoice for ${school.name}`,
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
      billReference = billData.bill?.billReference || null;
      billStatus = billData.bill?.payStatus?.toLowerCase() || "unpaid";
      tpui = billData.bill?.tpui || "";

      // Step 3: Update fee-payment with bill reference
      await client.query(
        `UPDATE schoolkano_payments 
         SET reference = $1, status = $2, tpui = $3, paid_at = NOW() 
         WHERE school_id = $4`,
        [billReference, billStatus, tpui, school_id],
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
