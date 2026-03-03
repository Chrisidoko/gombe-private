// app/api/generate-license/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { PDFFont, RGB } from "pdf-lib";
import pool from "@/lib/db";

interface LicenseData {
  school_name: string;
  license_number: string;
  issue_date: string;
  proprietor_name: string;
  // expiry_date: string;
  // lga: string;
  serial_number: string;
  address: string;
  courses?: string[]; // ← added
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
      proprietor_name: schoolData.proprietor_name,
      // expiry_date: formatDate(schoolData.license_expiry_date),
      serial_number: `SN/H/${schoolData.license_number.split("-").slice(-1)[0]}`, // e.g. SN-0001
      // lga: schoolData.lga,
      address: schoolData.address,
      courses: schoolData.courses || [], // ← from DB
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
      serial_number: "SN/H/0001",
      proprietor_name: "Dr. Mariam Abacha",
      issue_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      // expiry_date: new Date(
      //   Date.now() + 365 * 24 * 60 * 60 * 1000,
      // ).toLocaleDateString("en-US", {
      //   year: "numeric",
      //   month: "short",
      //   day: "numeric",
      // }),

      // lga: "Sample LGA",
      address: "123 Road Giwa Street, Kaduna State",
      courses: [
        // ← sample courses for preview
        "Bachelor of Science in Nursing",
        "Diploma in Community Health",
        "Certificate in Medical Laboratory Science",
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

// ── Helper: PDF generator (both pages) ───────────────────────────────────────
async function createLicensePDF(
  data: LicenseData & { qrCode: string },
): Promise<Buffer> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = await import("@pdf-lib/fontkit");
  const fs = await import("fs");
  const path = await import("path");

  const templatePath = path.join(
    process.cwd(),
    "public",
    "consent-certificate.pdf",
  );
  const existingPdfBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit.default);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const secondPage = pages[1]; // page 2 of your template

  const { width, height } = firstPage.getSize();

  // REPLACE with these
  const fontBytes = fs.readFileSync(
    path.join(process.cwd(), "public", "fonts", "poppins-regular.ttf"),
  );
  const boldFontBytes = fs.readFileSync(
    path.join(process.cwd(), "public", "fonts", "poppins-bold.ttf"),
  );

  const font = await pdfDoc.embedFont(fontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  const drawCentered = (
    page: typeof firstPage,
    text: string,
    y: number,
    size: number,
    f: typeof font,
    color = rgb(0, 0, 0),
  ) => {
    const textWidth = f.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font: f,
      color,
    });
  };

  // ── Helper to wrap long text into two lines
  const drawWrappedText = (
    page: typeof firstPage,
    text: string,
    x: number,
    y: number,
    size: number,
    f: typeof font,
    color = rgb(0.3, 0.3, 0.3),
    maxChars = 25, // ← adjust this to control where the split happens
    lineHeight = 16,
  ) => {
    if (text.length <= maxChars) {
      page.drawText(text, { x, y, size, font: f, color });
    } else {
      // Split at the last space before maxChars to avoid cutting a word
      const splitIndex = text.lastIndexOf(" ", maxChars);
      const line1 = text.substring(0, splitIndex);
      const line2 = text.substring(splitIndex + 1);
      page.drawText(line1, { x, y, size, font: f, color });
      page.drawText(line2, { x, y: y - lineHeight, size, font: f, color });
    }
  };

  // ── PAGE 1 ────────────────────────────────────────────────────────────────
  // School name in the large blank gap (tweak y if needed after preview)
  drawCentered(
    firstPage,
    data.school_name.toUpperCase(),
    height - 440,
    18,
    boldFont,
    rgb(0.1, 0.1, 0.1),
  );

  // License number — top right
  firstPage.drawText(`${data.license_number}`, {
    x: width - 130,
    y: height - 180,
    size: 11,
    font: boldFont,
    color: rgb(0.13, 0.37, 0.31),
  });

  // Address / location
  drawWrappedText(
    firstPage,
    `${data.address}`,
    50,
    height - 250,
    10,
    boldFont,
    rgb(0.2, 0.2, 0.2),
  );

  firstPage.drawText(`Issued ${data.issue_date}`, {
    x: 50,
    y: height - 200,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  firstPage.drawText(`${data.serial_number}`, {
    x: 50,
    y: height - 226,
    size: 10,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // firstPage.drawText(`Valid Until: ${data.expiry_date}`, {
  //   x: 50,
  //   y: height - 490,
  //   size: 9,
  //   font,
  //   color: rgb(0.4, 0.4, 0.4),
  // });

  // QR code
  if (data.qrCode) {
    const qrImageBytes = Buffer.from(data.qrCode.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    firstPage.drawImage(qrImage, {
      x: width - 130,
      y: height - 270,
      width: 84,
      height: 84,
    });
  }

  // ── PAGE 2 ────────────────────────────────────────────────────────────────
  if (secondPage) {
    const courses =
      data.courses && data.courses.length > 0
        ? data.courses
        : ["No courses listed"];

    // Institution name above
    secondPage.drawText(`${data.school_name}`, {
      x: 30,
      y: height - 210,
      size: 10,
      font: font,
      color: rgb(0.1, 0.1, 0.1),
    });
    // Institution address
    secondPage.drawText(`${data.address}`, {
      x: 30,
      y: height - 230,
      size: 10,
      font: font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Numbered courses list in the blank gap
    let courseY = height - 380;
    const lineH = 18;
    const maxCourseY = height - 500; // don't overflow into the body text below

    courses.forEach((course, index) => {
      if (courseY < maxCourseY) return;
      secondPage.drawText(`${index + 1}.  ${course}`, {
        x: 60,
        y: courseY,
        size: 11,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      courseY -= lineH;
    });

    // Reference number on page 2
    secondPage.drawText(`Ref: ${data.license_number}`, {
      x: width - 130,
      y: height - 230,
      size: 10,
      font: boldFont,
      color: rgb(0.13, 0.37, 0.31),
    });

    // Proprietor number on page 2
    secondPage.drawText(`${data.proprietor_name}`, {
      x: 30,
      y: height - 190,
      size: 10,
      font: boldFont,
      color: rgb(0.13, 0.37, 0.31),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
