// app/api/generate-license/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

interface LicenseData {
  school_id: string;
  school_name: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  invoice_number: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { status: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: LicenseData = await request.json();

    // Validate required fields
    if (!body.school_id || !body.school_name || !body.license_number) {
      return NextResponse.json(
        { status: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate QR code data URL
    const qrCodeData = await generateQRCode(body.license_number);

    // Here you would use a PDF library like pdf-lib to:
    // 1. Load your template PDF
    // 2. Add text fields (school name, license number, dates)
    // 3. Add QR code image
    // 4. Save the modified PDF

    // For now, returning the data structure
    // Install pdf-lib: npm install pdf-lib

    const pdfData = await createLicensePDF({
      ...body,
      qrCode: qrCodeData,
    });

    return new NextResponse(new Uint8Array(pdfData), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="license-${body.license_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating license:", error);
    return NextResponse.json(
      { status: false, error: "Failed to generate license" },
      { status: 500 }
    );
  }
}

// Helper function to generate QR code
async function generateQRCode(data: string): Promise<string> {
  // You can use a library like 'qrcode' for this
  // Install: npm install qrcode @types/qrcode

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
  data: LicenseData & { qrCode: string }
): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const fs = await import("fs");
  const path = await import("path");

  // Load your template PDF from public folder or server
  const templatePath = path.join(
    process.cwd(),
    "public",
    "license-template.pdf"
  );
  const existingPdfBytes = fs.readFileSync(templatePath);

  // Load the PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Get page dimensions
  const { width, height } = firstPage.getSize();

  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add School Name (adjust coordinates based on your template)
  firstPage.drawText(data.school_name, {
    x: 150, // Adjust X coordinate
    y: height - 200, // Adjust Y coordinate
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Add License Number
  firstPage.drawText(`License #: ${data.license_number}`, {
    x: 150,
    y: height - 250,
    size: 14,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Add School ID
  firstPage.drawText(`School ID: ${data.school_id}`, {
    x: 150,
    y: height - 280,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add Issue Date
  firstPage.drawText(`Issued: ${data.issue_date}`, {
    x: 150,
    y: height - 310,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add Expiry Date
  firstPage.drawText(`Valid Until: ${data.expiry_date}`, {
    x: 150,
    y: height - 340,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add QR Code (if data URL is available)
  if (data.qrCode) {
    // Convert data URL to buffer
    const qrImageBytes = Buffer.from(data.qrCode.split(",")[1], "base64");

    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    firstPage.drawImage(qrImage, {
      x: width - 150, // Position on right side
      y: height - 250,
      width: 100,
      height: 100,
    });
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// GET endpoint to preview a sample license
export async function GET() {
  try {
    const sampleData: LicenseData = {
      school_id: "SAMPLE123",
      school_name: "Sample School Name",
      license_number: "LIC-2026-001",
      issue_date: new Date().toLocaleDateString(),
      expiry_date: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      invoice_number: "INV-SAMPLE",
    };

    const qrCodeData = await generateQRCode(sampleData.license_number);
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
      { status: 500 }
    );
  }
}
