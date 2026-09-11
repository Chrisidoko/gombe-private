// app/api/generate-license/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface LicenseData {
  school_name: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  proprietor_name: string;
  courses?: string[];
}

// ── POST — generate real license from DB ──────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { school_id } = body;

    if (!school_id) {
      return NextResponse.json(
        { status: false, error: "school_id is required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT
        school_id,
        name,
        license_number,
        last_license_renewal,
        license_expiry_date,
        state,
        lga,
        address,
        proprietor_name,
        ownership,
        phone,
        email,
        courses
       FROM schoolskano
       WHERE school_id = $1`,
      [school_id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { status: false, error: "School not found" },
        { status: 404 },
      );
    }

    const schoolData = result.rows[0];

    const formatDate = (date: string | Date) =>
      new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const licenseData: LicenseData = {
      school_name: schoolData.name,
      license_number: schoolData.license_number,
      issue_date: formatDate(schoolData.last_license_renewal),
      expiry_date: formatDate(schoolData.license_expiry_date),
      proprietor_name: schoolData.proprietor_name,
      courses: schoolData.courses || [],
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/";

    const qrCodeData = await generateQRCode(
      `${baseUrl}verify?license=${encodeURIComponent(licenseData.license_number)}`,
    );

    const pdfData = await createLicensePDF({
      ...licenseData,
      qrCode: qrCodeData,
    });

    return new NextResponse(new Uint8Array(pdfData), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Certificate-${licenseData.license_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating license:", error);
    return NextResponse.json(
      { status: false, error: "Failed to generate license" },
      { status: 500 },
    );
  }
}

// ── GET — sample preview (preserved) ─────────────────────────────────────────
export async function GET() {
  try {
    const sampleData: LicenseData = {
      school_name: "Marayam Abacha College of Health",
      license_number: "MOE/H/001234",
      proprietor_name: "Dr. Mariam Abacha",
      issue_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      expiry_date: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      courses: [
        "Bachelor of Science in Nursing",
        "Diploma in Community Health",
        "Certificate in Medical Laboratory Science",
        "Diploma in Public Health",
        "Certificate in Pharmacy Technician Studies",
        "Diploma in Environmental Health Technology",
        "Certificate in Health Information Management",
      ],
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const qrCodeData = await generateQRCode(
      `${baseUrl}verify?license=${encodeURIComponent(sampleData.license_number)}`,
    );

    const pdfData = await createLicensePDF({
      ...sampleData,
      qrCode: qrCodeData,
    });

    return new NextResponse(new Uint8Array(pdfData), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="sample-license.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generating sample license:", error);
    return NextResponse.json(
      { status: false, error: "Failed to generate sample license" },
      { status: 500 },
    );
  }
}

// ── Helper: QR code ───────────────────────────────────────────────────────────
async function generateQRCode(data: string): Promise<string> {
  const QRCode = await import("qrcode");
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
  } catch (err) {
    console.error("QR code generation failed:", err);
    return "";
  }
}

// ── Helper: PDF generator ─────────────────────────────────────────────────────
// Single-page Gombe State "Certificate of Registration" template
// (public/certificate-empty-state.pdf). The underlines, table borders, and
// every static label are already part of that artwork — this only draws the
// per-school values into the blank spaces. Coordinates were measured against
// the actual template (pdftotext -bbox cross-checked with a 150 DPI render,
// scale 2.0833 px/pt), not eyeballed — but a design this pixel-specific may
// still need a small nudge after the first real preview.
async function createLicensePDF(
  data: LicenseData & { qrCode: string },
): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const fs = await import("fs");
  const path = await import("path");

  const templatePath = path.join(
    process.cwd(),
    "public",
    "certificate-empty-state.pdf",
  );
  const existingPdfBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Times matches the template's own serif body text far better than a
  // sans-serif face would.
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const dark = rgb(0.1, 0.1, 0.1);
  const accent = rgb(0.75, 0.15, 0.15); // matches the template's red date/ref accents

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    f: typeof font,
    color = dark,
  ) => {
    const textWidth = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font: f, color });
  };

  // Wraps text onto up to `maxLines` centered lines at `size`. A school's
  // official name must never be cut off (unlike a course name in the
  // Programs table, where an ellipsis is fine), so this only reports
  // whether it fit — the caller shrinks the font size and retries rather
  // than truncating.
  const wrapLines = (
    text: string,
    size: number,
    f: typeof font,
    maxWidth: number,
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (f.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Finds the largest font size (down to `minSize`) at which `text` wraps
  // into no more than `maxLines` lines, each within `maxWidth`.
  const fitTextBlock = (
    text: string,
    startSize: number,
    minSize: number,
    f: typeof font,
    maxWidth: number,
    maxLines: number,
  ): { lines: string[]; size: number } => {
    for (let size = startSize; size >= minSize; size--) {
      const lines = wrapLines(text, size, f, maxWidth);
      const fits =
        lines.length <= maxLines &&
        lines.every((line) => f.widthOfTextAtSize(line, size) <= maxWidth);
      if (fits) return { lines, size };
    }
    // Smallest size still didn't fit cleanly — use it anyway rather than
    // shrinking indefinitely; a long single word may still overrun slightly.
    return { lines: wrapLines(text, minSize, f, maxWidth), size: minSize };
  };

  // Draws text centered above `startY`, wrapping onto up to two lines and
  // shrinking the font size first if the name is too long to fit either way.
  const drawFittedName = (
    text: string,
    startY: number,
    startSize: number,
    minSize: number,
    f: typeof font,
    color: ReturnType<typeof rgb>,
    maxWidth: number,
    maxLines: number,
  ) => {
    const { lines, size } = fitTextBlock(
      text,
      startSize,
      minSize,
      f,
      maxWidth,
      maxLines,
    );
    const lineHeight = size * 1.25;

    // Multiple lines push the top line up so the block still sits just
    // above the ruled line rather than growing downward into it.
    const blockStartY = startY + (lines.length - 1) * lineHeight;
    lines.forEach((line, i) => {
      const lineWidth = f.widthOfTextAtSize(line, size);
      page.drawText(line, {
        x: (width - lineWidth) / 2,
        y: blockStartY - i * lineHeight,
        size,
        font: f,
        color,
      });
    });
  };

  // School name — centered just above the first ruled line. Shrinks from
  // 16pt down to 11pt before it would ever wrap past two lines.
  drawFittedName(
    data.school_name.toUpperCase(),
    height - 350,
    16,
    11,
    boldFont,
    dark,
    460,
    2,
  );

  // Proprietor name — centered just above the second ruled line.
  drawCentered(data.proprietor_name, height - 432, 13, boldFont, dark);

  // Certificate number — centered inside the "Certificate No." box
  // (box spans x: 461.8–565.0), not the full page width.
  const certBoxCenterX = (461.8 + 565.0) / 2;
  const certNumberSize = 13;
  const certNumberWidth = boldFont.widthOfTextAtSize(
    data.license_number,
    certNumberSize,
  );
  page.drawText(data.license_number, {
    x: certBoxCenterX - certNumberWidth / 2,
    y: height - 210,
    size: certNumberSize,
    font: boldFont,
    color: accent,
  });

  // QR code — tucked under the certificate number box, kept clear of the
  // "This is to certify..." paragraph that starts at y (top-down) ≈ 288.
  if (data.qrCode) {
    const qrImageBytes = Buffer.from(data.qrCode.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: 565 - 50,
      y: height - 288,
      width: 50,
      height: 50,
    });
  }

  // Issue / Expiry dates — printed right after their existing labels.
  page.drawText(data.issue_date, {
    x: 300.6,
    y: height - 752,
    size: 10,
    font: boldFont,
    color: accent,
  });
  page.drawText(data.expiry_date, {
    x: 466.2,
    y: height - 752,
    size: 10,
    font: boldFont,
    color: accent,
  });

  // Programs table — 2 columns × 5 rows, filled left-to-right, row by row.
  // The header and cell borders are already drawn on the template.
  const courses =
    data.courses && data.courses.length > 0 ? data.courses : ["No courses listed"];
  const tableRows = 5;
  const tableCols = 2;
  const visibleSlots = tableRows * tableCols;
  const rowTop = 558.2;
  const rowHeight = 27.08;
  const col1X = 68;
  const col2X = 298.4;
  const courseFontSize = 10;

  const visibleCourses = courses.slice(0, visibleSlots);
  const remaining = courses.length - visibleSlots;

  visibleCourses.forEach((course, index) => {
    const row = Math.floor(index / tableCols);
    const isFirstColumn = index % tableCols === 0;
    const baselineTopDown = rowTop + row * rowHeight + 18;
    page.drawText(truncateToWidth(course, courseFontSize, font, 210), {
      x: isFirstColumn ? col1X : col2X,
      y: height - baselineTopDown,
      size: courseFontSize,
      font,
      color: dark,
    });
  });

  if (remaining > 0) {
    const noteText = `+ ${remaining} more — scan QR for full list`;
    const noteWidth = font.widthOfTextAtSize(noteText, 9);
    page.drawText(noteText, {
      x: (width - noteWidth) / 2,
      y: height - 705,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Cuts off a course name with an ellipsis if it would overflow its table
// cell — the cell has no wrap room, so a clipped word reads worse than a
// clean truncation.
function truncateToWidth(
  text: string,
  size: number,
  font: Awaited<ReturnType<import("pdf-lib").PDFDocument["embedFont"]>>,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 1 &&
    font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}
