// app/api/generate-license/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDisplayedExpiry } from "@/lib/certificate";
import { requireRole, requireSchoolAccess } from "@/lib/apiAuth";

interface LicenseData {
  school_name: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  proprietor_name: string;
  courses?: string[];
}

// "25 June, 2026", as on the approved draft
function formatCertificateDate(date: string | Date) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-GB", { day: "numeric" });
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${day} ${month}, ${d.getFullYear()}`;
}

// ── POST — generate real license from DB ──────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { school_id } = body;

    const denied = await requireSchoolAccess(school_id);
    if (denied) return denied;

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

    const licenseData: LicenseData = {
      school_name: schoolData.name,
      license_number: schoolData.license_number,
      issue_date: formatCertificateDate(schoolData.last_license_renewal),
      // Not printed while certificates don't expire (see createLicensePDF)
      expiry_date: getDisplayedExpiry(schoolData)
        ? formatCertificateDate(schoolData.license_expiry_date)
        : "Not applicable",
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
  const denied = await requireRole("CBS_Admin");
  if (denied) return denied;

  try {
    const sampleData: LicenseData = {
      school_name: "Marayam Abacha College of Health",
      license_number: "MOE/H/001234",
      proprietor_name: "Dr. Mariam Abacha",
      issue_date: formatCertificateDate(new Date()),
      expiry_date: formatCertificateDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ),
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
// per-school values into the blank spaces, laid out to match the approved
// draft.
//
// Positions below are measured top-down in points from the top of the page,
// against a 288 DPI render of the template. The template's page box starts
// 7.83pt above zero rather than at it, so `fromTop` converts using the box's
// real top edge; plain `height - y` lands every value 7.83pt too low.
async function createLicensePDF(
  data: LicenseData & { qrCode: string },
): Promise<Buffer> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const { default: fontkit } = await import("@pdf-lib/fontkit");
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
  const { width } = page.getSize();
  const box = page.getMediaBox();
  const fromTop = (y: number) => box.y + box.height - y;

  // Embedded so every PDF viewer shows the same letters. The template's
  // labels are DM Sans, used here for the number and dates. Its body text is
  // Times New Roman MT Pro, a paid font; Tinos (public/fonts/certificate,
  // both under the SIL Open Font License) has the same letter widths.
  pdfDoc.registerFontkit(fontkit);
  const fontFile = (name: string) =>
    fs.readFileSync(
      path.join(process.cwd(), "public", "fonts", "certificate", name),
    );
  const font = await pdfDoc.embedFont(fontFile("Tinos-Regular.ttf"), {
    subset: true,
  });
  const serifBold = await pdfDoc.embedFont(fontFile("Tinos-Bold.ttf"), {
    subset: true,
  });
  const sansBold = await pdfDoc.embedFont(fontFile("DMSans-Bold.ttf"), {
    subset: true,
  });

  const dark = rgb(0.1, 0.1, 0.1);
  const accent = rgb(0.69, 0.23, 0.18); // the draft's red for the number and dates

  // Wraps text into lines no wider than `maxWidth` at `size`.
  const wrapLines = (
    text: string,
    size: number,
    f: typeof font,
    maxWidth: number,
  ): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
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

  // A name must never be cut off. It shrinks on one line first, then wraps
  // onto two smaller lines. Two lines sit lower, closer to the ruled line
  // under them, so the block keeps clear of the sentence above.
  const drawName = (
    text: string,
    baseline: number,
    twoLineBaseline: number,
    f: typeof font,
    opts: { size: number; minSize: number; twoLineSize: number; maxWidth: number },
  ) => {
    const clean = text.trim().replace(/\s+/g, " ");
    let lines = [clean];
    let size = opts.size;
    while (size > opts.minSize && f.widthOfTextAtSize(clean, size) > opts.maxWidth) {
      size -= 0.5;
    }
    if (f.widthOfTextAtSize(clean, size) > opts.maxWidth) {
      size = opts.twoLineSize;
      lines = wrapLines(clean, size, f, opts.maxWidth);
      while (size > 9 && lines.length > 2) {
        size -= 0.5;
        lines = wrapLines(clean, size, f, opts.maxWidth);
      }
    }
    const lineHeight = size * 1.15;
    const lastBaseline = lines.length > 1 ? twoLineBaseline : baseline;
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: (width - f.widthOfTextAtSize(line, size)) / 2,
        y: fromTop(lastBaseline - (lines.length - 1 - i) * lineHeight),
        size,
        font: f,
        color: dark,
      });
    });
  };

  // School name — ruled line at 365, "establishment of" ends at 320
  drawName(data.school_name, 347, 356, serifBold, {
    size: 17.5,
    minSize: 13,
    twoLineSize: 13,
    maxWidth: 465,
  });

  // Proprietor name — ruled line at 443, "Proprietorship of" ends at 406
  drawName(data.proprietor_name || "", 433, 435, serifBold, {
    size: 17.5,
    minSize: 13,
    twoLineSize: 13,
    maxWidth: 465,
  });

  // Certificate number — under "Certificate No.", centred in its box
  // (x 461–565)
  const certBoxCenterX = (461 + 565.2) / 2;
  let certNumberSize = 13;
  while (
    certNumberSize > 7 &&
    sansBold.widthOfTextAtSize(data.license_number, certNumberSize) > 96
  ) {
    certNumberSize -= 0.5;
  }
  page.drawText(data.license_number, {
    x:
      certBoxCenterX -
      sansBold.widthOfTextAtSize(data.license_number, certNumberSize) / 2,
    y: fromTop(201),
    size: certNumberSize,
    font: sansBold,
    color: accent,
  });

  // QR code — centred under the number, over the box's bottom edge (235)
  // and clear of the "This is to certify..." line (289)
  if (data.qrCode) {
    const qrImageBytes = Buffer.from(data.qrCode.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrSize = 68;
    page.drawImage(qrImage, {
      x: certBoxCenterX - qrSize / 2,
      y: fromTop(211 + qrSize),
      width: qrSize,
      height: qrSize,
    });
  }

  // Issue date — on the baseline of its "Issue Date:" label (ends x 294.6)
  page.drawText(data.issue_date, {
    x: 300.6,
    y: fromTop(751.3),
    size: 11.5,
    font: sansBold,
    color: accent,
  });

  // Expiry date — certificates don't expire for now, so it's left blank.
  // The "Expiry Date:" label is part of the template artwork. To bring it
  // back, uncomment this; it sits on that label's baseline (ends x 460.2).
  // page.drawText(data.expiry_date, {
  //   x: 466.2,
  //   y: fromTop(750),
  //   size: 11.5,
  //   font: sansBold,
  //   color: accent,
  // });

  // Programs table — 2 columns × 5 rows, filled left-to-right, row by row.
  // The header and cell borders are already drawn on the template: rows
  // start at 565.3 and are 25.9pt tall, columns split at x 290.6.
  const courses =
    data.courses && data.courses.length > 0 ? data.courses : ["No courses listed"];
  const tableRows = 5;
  const tableCols = 2;
  const visibleSlots = tableRows * tableCols;
  const rowTop = 565.3;
  const rowHeight = 25.9;
  const col1X = 67.5;
  const col2X = 298.6;
  const cellTextWidth = 215;
  const courseFontSize = 10;
  // Baseline that centres capital letters in the row
  const capHeight = font.heightAtSize(courseFontSize, { descender: false });

  const visibleCourses = courses.slice(0, visibleSlots);
  const remaining = courses.length - visibleSlots;

  visibleCourses.forEach((course, index) => {
    const row = Math.floor(index / tableCols);
    const isFirstColumn = index % tableCols === 0;
    const baselineTopDown = rowTop + row * rowHeight + rowHeight / 2 + capHeight / 2;
    page.drawText(truncateToWidth(course, courseFontSize, font, cellTextWidth), {
      x: isFirstColumn ? col1X : col2X,
      y: fromTop(baselineTopDown),
      size: courseFontSize,
      font,
      color: dark,
    });
  });

  // Below the table (ends 694.8), above the signature
  if (remaining > 0) {
    const noteText = `+ ${remaining} more — scan QR for full list`;
    const noteWidth = font.widthOfTextAtSize(noteText, 9);
    page.drawText(noteText, {
      x: (width - noteWidth) / 2,
      y: fromTop(706),
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
