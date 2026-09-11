// app/api/transactions/receipt/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Transaction id is required" },
      { status: 400 },
    );
  }

  try {
    const txnRes = await pool.query(
      `SELECT id, reference, amount, status, payment_item, payment_method,
              school_id, paid_at, created_at
       FROM transactionskano
       WHERE id = $1`,
      [id],
    );

    if (txnRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    const txn = txnRes.rows[0];

    if (txn.school_id !== user.institution) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (txn.status.toLowerCase() !== "paid") {
      return NextResponse.json(
        { error: "Receipt is only available for paid transactions" },
        { status: 400 },
      );
    }

    const schoolRes = await pool.query(
      `SELECT name, address, lga, state FROM schoolskano WHERE school_id = $1`,
      [txn.school_id],
    );
    const school = schoolRes.rows[0] || {};

    const pdfBytes = await createReceiptPDF({
      schoolName: school.name || txn.school_id,
      address: [school.address, school.lga, school.state]
        .filter(Boolean)
        .join(", "),
      reference: txn.reference,
      paymentItem: txn.payment_item,
      amount: Number(txn.amount),
      paidAt: txn.paid_at || txn.created_at,
      schoolId: txn.school_id,
    });

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Receipt-${txn.reference}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Receipt generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 },
    );
  }
}

async function createReceiptPDF(data: {
  schoolName: string;
  address: string;
  reference: string;
  paymentItem: string;
  amount: number;
  paidAt: string;
  schoolId: string;
}): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const fs = await import("fs");
  const path = await import("path");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 421.89]); // A5 landscape
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const green = rgb(0.157, 0.655, 0.271); // #28a745
  const dark = rgb(0.15, 0.15, 0.15);
  const gray = rgb(0.45, 0.45, 0.45);

  // Header band
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: green,
  });

  // Logo — white backing square, same treatment as everywhere else in the
  // app (a white box behind the logo regardless of its own colors).
  const logoBoxSize = 44;
  const logoBoxX = 32;
  const logoBoxY = height - 80 + (80 - logoBoxSize) / 2;
  page.drawRectangle({
    x: logoBoxX,
    y: logoBoxY,
    width: logoBoxSize,
    height: logoBoxSize,
    color: rgb(1, 1, 1),
  });

  try {
    const logoPath = path.join(process.cwd(), "public", "gombe_logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    const padding = 6;
    const maxDim = logoBoxSize - padding * 2;
    const scale = Math.min(
      maxDim / logoImage.width,
      maxDim / logoImage.height,
    );
    const logoWidth = logoImage.width * scale;
    const logoHeight = logoImage.height * scale;

    page.drawImage(logoImage, {
      x: logoBoxX + (logoBoxSize - logoWidth) / 2,
      y: logoBoxY + (logoBoxSize - logoHeight) / 2,
      width: logoWidth,
      height: logoHeight,
    });
  } catch (err) {
    console.error("Receipt logo embed failed:", err);
  }

  const titleX = logoBoxX + logoBoxSize + 14;
  page.drawText("GOMBE STATE MINISTRY OF EDUCATION", {
    x: titleX,
    y: height - 35,
    size: 14,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  page.drawText("Private Tertiary Institutions — Payment Receipt", {
    x: titleX,
    y: height - 55,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  // PAID stamp
  const stampText = "PAID";
  const stampSize = 20;
  const stampWidth = boldFont.widthOfTextAtSize(stampText, stampSize);
  page.drawText(stampText, {
    x: width - stampWidth - 40,
    y: height - 55,
    size: stampSize,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  let y = height - 120;
  const lineGap = 26;
  const labelX = 40;
  const valueX = 200;

  const row = (label: string, value: string) => {
    page.drawText(label, { x: labelX, y, size: 10, font, color: gray });
    page.drawText(value, {
      x: valueX,
      y,
      size: 11,
      font: boldFont,
      color: dark,
    });
    y -= lineGap;
  };

  row("Institution", data.schoolName);
  row("Address", data.address || "—");
  row("Reference", data.reference);
  row("Payment Item", data.paymentItem);
  row(
    "Amount",
    `NGN ${data.amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
    })}`,
  );
  row(
    "Date Paid",
    new Date(data.paidAt).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  row("School ID", data.schoolId);

  // Footer
  page.drawLine({
    start: { x: 40, y: 70 },
    end: { x: width - 40, y: 70 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  page.drawText(
    "This is a system-generated receipt and does not require a signature.",
    { x: 40, y: 50, size: 8, font, color: gray },
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
