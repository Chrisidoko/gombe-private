// app/api/generate-license/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { formatDate } from "@/lib/formatDate";
import { PDFFont, RGB } from "pdf-lib";
import pool from "@/lib/db";

interface LicenseData {
  school_name: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  state: string;
  lga: string;
  address: string;
  ownership: string;
  phone: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    // const cookieStore = await cookies();
    // const authToken = cookieStore.get("auth_token")?.value;

    // if (!authToken) {
    //   return NextResponse.json(
    //     { status: false, error: "Unauthorized" },
    //     { status: 401 },
    //   );
    // }

    const body = await request.json();
    const { school_id } = body;

    if (!school_id) {
      return NextResponse.json(
        { status: false, error: "school_id is required" },
        { status: 400 },
      );
    }

    // Fetch the most recent school information from database
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
        ownership,
        phone,
        email
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

    // Format dates
    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const licenseData: LicenseData = {
      school_name: schoolData.name,
      license_number: schoolData.license_number,
      issue_date: formatDate(schoolData.last_license_renewal),
      expiry_date: formatDate(schoolData.license_expiry_date),
      state: schoolData.state,
      lga: schoolData.lga,
      address: schoolData.address,
      ownership: schoolData.ownership,
      phone: schoolData.phone || "N/A",
      email: schoolData.email || "N/A",
    };

    // Generate QR code data URL
    const qrCodeData = await generateQRCode(
      `License: ${licenseData.license_number}\nSchool: ${licenseData.school_name}\nValid Until: ${licenseData.expiry_date}`,
    );

    // Generate PDF
    const pdfData = await createLicensePDF({
      ...licenseData,
      qrCode: qrCodeData,
    });

    return new NextResponse(new Uint8Array(pdfData), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="license-${licenseData.license_number}.pdf"`,
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

// Helper function to generate QR code
async function generateQRCode(data: string): Promise<string> {
  const QRCode = await import("qrcode");

  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error("QR code generation failed:", err);
    return "";
  }
}

// Helper function to create PDF with dynamic content
async function createLicensePDF(
  data: LicenseData & { qrCode: string },
): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const fs = await import("fs");
  const path = await import("path");

  // Load your template PDF from public folder or server
  const templatePath = path.join(
    process.cwd(),
    "public",
    "license-template.pdf",
  );
  const existingPdfBytes = fs.readFileSync(templatePath);

  // Load the PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Get page dimensions
  const { width, height } = firstPage.getSize();

  const drawCenteredText = (
    text: string,
    y: number,
    size: number,
    font: PDFFont,
    color: RGB = rgb(0, 0, 0),
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    firstPage.drawText(text, { x, y, size, font, color });
  };

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add School Name (adjust coordinates based on your template)
  drawCenteredText(
    data.school_name.toUpperCase(),
    height - 370,
    20,
    boldFont,
    rgb(0, 0, 0),
  );

  // Add License Number
  firstPage.drawText(`LN:${data.license_number}`, {
    x: width - 140,
    y: height - 160,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.8),
  });

  // Add Address
  firstPage.drawText(`Address: ${data.address}`, {
    x: 50,
    y: height - 170,
    size: 11,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add LGA and State
  firstPage.drawText(`${data.lga}, ${data.state} State`, {
    x: 50,
    y: height - 190,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add Ownership Type
  drawCenteredText(
    `Ownership: ${data.ownership}`,
    height - 440,
    16,
    boldFont,
    rgb(0.2, 0.2, 0.8),
  );

  // Add Contact Information
  firstPage.drawText(`Phone: ${data.phone} | Email: ${data.email}`, {
    x: 150,
    y: height - 400,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add Issue Date
  firstPage.drawText(`Issued: ${data.issue_date}`, {
    x: 50,
    y: height - 210,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add Expiry Date
  firstPage.drawText(`Valid Until: ${data.expiry_date}`, {
    x: 50,
    y: height - 230,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add QR Code (if data URL is available)
  if (data.qrCode) {
    const qrImageBytes = Buffer.from(data.qrCode.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    firstPage.drawImage(qrImage, {
      x: width - 130,
      y: height - 270,
      width: 100,
      height: 100,
    });
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// GET endpoint to preview a sample license (optional)
export async function GET() {
  try {
    const sampleData: LicenseData = {
      school_name: "Marayam Abacha College of Health",
      license_number: "KN-2026-001234",
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
      state: "Kaduna",
      lga: "Sample LGA",
      address: "123 Sample Street, Sample Area",
      ownership: "Private",
      phone: "+234 800 000 0000",
      email: "sample@school.com",
    };

    const qrCodeData = await generateQRCode(
      `License: ${sampleData.license_number}\nSchool: ${sampleData.school_name}\nValid Until: ${sampleData.expiry_date}`,
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
