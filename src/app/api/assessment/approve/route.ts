// /api/assessment/approve/route.ts
// Currently this route is only used for the self assessment approval flow, where the ministry approves assessments of an individual assessment made by a school.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    console.log("🟢 Incoming body:", body);

    const { school_id, assessment_id, amount } = body;

    if (!school_id || !assessment_id || !amount) {
      console.error("❌ Missing fields:", { school_id, assessment_id, amount });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await client.query("BEGIN");
    console.log("🔹 Starting approval for:", { school_id, assessment_id });

    // Step 1: Update assessment
    await client.query(
      "UPDATE schoolskano_assessments SET status = 'approved' WHERE id = $1",
      [assessment_id],
    );
    console.log("✅ Assessment approved");

    // Step 2: Generate invoice
    // assessment_id must be set here to satisfy the "only_one_assessment_check"
    // constraint on schoolkano_invoices. See also: bulk route (sets
    // bulk_assessment_id) and demand-notice route (both fields NULL — allowed
    // after the constraint was relaxed to support standalone demand notices).
    const invoice_number = `INV-${school_id}-${Date.now()}`;
    const insertQuery = `
      INSERT INTO schoolkano_invoices (school_id, invoice_number, assessment_id, amount, status, issue_date, due_date)
      VALUES ($1, $2, $3, $4, 'unpaid', NOW(), NOW() + INTERVAL '14 days')
      RETURNING id, invoice_number, due_date;
    `;

    const { rows } = await client.query(insertQuery, [
      school_id,
      invoice_number,
      assessment_id,
      amount,
    ]);
    // console.log("Invoice inserted:", rows[0]);

    const invoiceId = rows[0].id;
    const dueDate = rows[0].due_date;

    // Step 3: Fetch school info (for both bill creation and email)
    const schoolRes = await client.query(
      "SELECT email, name, phone, address FROM schoolskano WHERE school_id = $1",
      [school_id],
    );
    const school = schoolRes.rows[0];
    // console.log(" School found:", school);

    if (!school) throw new Error("School not found");

    // Step 4: Create bill with 3rd party API (skipped when gateway is not yet configured)
    const GATEWAY_ACTIVE = process.env.PAYKADUNA_API_KEY !== "STUB_NOT_ACTIVE";
    let billReference = null;
    let billStatus = null;
    let tpui = null;

    if (!GATEWAY_ACTIVE) {
      console.log("⚠️ Payment gateway not configured — invoice created without bill reference.");
    }

    if (GATEWAY_ACTIVE) try {
      const billPayload = {
        engineCode: process.env.PAYKADUNA_ENGINE_CODE,
        identifier: school.school_id, // Using school_id as identifier
        firstName: school.name.split(" ")[0] || school.name,
        middleName: school.name.split(" ")[1] || "",
        lastName:
          school.name.split(" ").slice(2).join(" ") ||
          school.name.split(" ")[0],
        address: school.address || "Gombe, Nigeria",
        telephone: school.phone || "08000000000",
        esBillDetailsDto: [
          {
            amount: parseFloat(amount),
            mdasId: parseInt(process.env.MDAS_ID || "3654"), // Configure this in .env
            narration: `Institution Payment - ${invoice_number}`,
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
      // console.log("🔹 Creating bill with 3rd party API...");
      // console.log("📍 API URL:", apiUrl);
      // console.log("📦 Payload:", billPayload);
      // console.log("🔐 Signature:", signature);

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
        console.error("❌ 3rd party API error:", errorData);
        throw new Error(`Bill creation failed: ${billResponse.statusText}`);
      }

      const billData = await billResponse.json();
      console.log("✅ Bill created:", billData);

      // Extract billReference and status from response
      billReference = billData.bill?.billReference || invoice_number;
      billStatus = billData.bill?.payStatus || "Unpaid";
      tpui = billData.bill?.tpui || " ";

      // Step 4: Update invoice with bill reference
      await client.query(
        `UPDATE schoolkano_invoices 
         SET bill_reference = $1, status = $2, tpui = $3, updated_at = NOW() 
         WHERE id = $4`,
        [billReference, billStatus, tpui, invoiceId],
      );
      console.log("✅ Invoice updated with bill reference");
    } catch (billError) {
      console.error("⚠️ Bill creation failed:", billError);

      // Decision point: Do you want to rollback everything or just log the error?
      // Option A: Rollback everything (uncomment below)
      throw billError;

      // Option B: Continue with invoice creation, log error for manual retry
      // await client.query(
      //   `UPDATE schoolkano_invoices
      //    SET notes = $1, updated_at = NOW()
      //    WHERE id = $2`,
      //   [
      //     `Bill creation failed: ${
      //       billError instanceof Error ? billError.message : "Unknown error"
      //     }`,
      //     invoiceId,
      //   ]
      // );
      // console.log(
      //   "⚠️ Invoice created but bill creation failed - marked for retry"
      // );
    }

    // Step 5: Send email notification
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials in environment variables.");
    }

    const formattedDueDate = new Date(dueDate).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email with payment details
    const transporter = nodemailer.createTransport({
      host: "paypro-solutions.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace("%40", "@"),
      },
    });

    await transporter.sendMail({
      from: `"GESMS" <${process.env.SMTP_USER}>`,
      to: school.email,
      subject: `Invoice for School Assessment (${school.name})`,
      html: `
        <h2>Invoice Notification</h2>
        <p>Dear ${school.name},</p>
        <p>Your assessment has been approved. Please proceed to make payment for the generated invoice.</p>
        <p><strong>Invoice Reference:</strong> ${invoice_number}</p>
        ${
          billReference && billReference !== invoice_number
            ? `<p><strong>Bill Reference:</strong> ${billReference}</p>`
            : ""
        }
        <p><strong>Amount Due:</strong> ₦${parseFloat(
          amount,
        ).toLocaleString()}</p>
        <p><strong>Status:</strong> ${billStatus || "Unpaid"}</p>
        <p><strong>Payment Due Date:</strong> ${formattedDueDate}</p>
        <br/>
        <a href="https://kaptems.payprosolutionsltd.com/"
           style="background-color:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">Go to Dashboard</a>
      `,
    });

    await client.query("COMMIT");
    console.log("✅ Email sent successfully");

    return NextResponse.json({
      message: "Assessment approved and invoice generated successfully",
      invoice: {
        id: invoiceId,
        invoice_number,
        bill_reference: billReference,
        bill_status: billStatus,
        due_date: dueDate,
      },
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("🔥 Error approving assessment:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

// import { NextResponse } from "next/server";
// import pool from "@/lib/db";
// import nodemailer from "nodemailer";

// export async function POST(req: Request) {
//   const client = await pool.connect();

//   try {
//     const body = await req.json();
//     console.log("🟢 Incoming body:", body); // 👈 Log what frontend sent

//     const { school_id, assessment_id, amount } = body;

//     // Log missing fields for clarity
//     if (!school_id || !assessment_id || !amount) {
//       console.error("❌ Missing fields:", { school_id, assessment_id, amount });
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//     }

//     await client.query("BEGIN");
//     console.log("🔹 Starting approval for:", { school_id, assessment_id });

//     // Update assessment
//     await client.query(
//       "UPDATE schoolskano_assessments SET status = 'approved' WHERE id = $1",
//       [assessment_id]
//     );
//     console.log("✅ Assessment approved");

//     // Generate invoice
//     const invoice_number = `INV-${school_id}-${Date.now()}`;
//     const insertQuery = `
//       INSERT INTO schoolkano_invoices (school_id, invoice_number, assessment_id, amount, status, issue_date, due_date)
//       VALUES ($1, $2, $3, $4, 'unpaid', NOW(), NOW() + INTERVAL '14 days')
//       RETURNING id, invoice_number, due_date;
//     `;

//     const { rows } = await client.query(insertQuery, [
//       school_id,
//       invoice_number,
//       assessment_id,
//       amount,
//     ]);
//     console.log("✅ Invoice inserted:", rows[0]);

//     // Fetch school info
//     const schoolRes = await client.query(
//       "SELECT email, name FROM schoolskano WHERE school_id = $1",
//       [school_id]
//     );
//     const school = schoolRes.rows[0];
//     console.log("🏫 School found:", school);

//     if (!school) throw new Error("School not found");

//     // ✅ Verify SMTP credentials
//     if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
//       throw new Error("Missing SMTP credentials in environment variables.");
//     }

//     const dueDate = new Date(rows[0].due_date).toLocaleDateString("en-NG", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });

//     // Send email
//     const transporter = nodemailer.createTransport({
//       host: "paypro-solutions.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS.replace("%40", "@"),
//       },
//     });

//     await transporter.sendMail({
//       from: `"CBS Portal" <${process.env.SMTP_USER}>`,
//       to: school.email,
//       subject: `Invoice for School Assessment (${school.name})`,
//       html: `
//         <h2>Invoice Notification</h2>
//         <p>Dear ${school.name},</p>
//         <p>Your assessment has been approved. Please proceed to make payment for the generated invoice.</p>
//         <p><strong>Invoice Reference:</strong> ${invoice_number}</p>
//         <p><strong>Amount Due:</strong> ₦${amount.toLocaleString()}</p>
//         <p><strong>Status:</strong> Unpaid</p>
//       <p><strong>Payment Due Date:</strong> ${dueDate}</p>
//         <br/>
//         <a href="https://privateuni.payprosolutionsltd.com/"
//            style="background-color:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">Go to Dashboard</a>
//       `,
//     });

//     await client.query("COMMIT");
//     console.log("✅ Email sent successfully");

//     return NextResponse.json({
//       message: "Assessment approved and invoice generated successfully",
//       invoice: rows[0],
//     });
//   } catch (error: unknown) {
//     await client.query("ROLLBACK");
//     console.error("🔥 Error approving assessment:", error);

//     const errorMessage =
//       error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: errorMessage }, { status: 500 });
//   } finally {
//     client.release();
//   }
// }
