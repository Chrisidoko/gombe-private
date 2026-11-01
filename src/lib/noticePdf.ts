// lib/noticePdf.ts
// The Single Demand Notice, laid out like the GIRS paper notice. Shares the
// certificate's approach (see api/generate-license): Times to match official
// print, and a QR code back to a public page confirming the document is real.
// pdf-lib's standard fonts have no ₦ glyph, so amounts use "N" as the paper does.
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

type NoticeLine = {
  notice_id: number;
  year: number;
  amount: string | null;
  status: string;
  code: string;
  subhead_name: string;
};

const MARGIN = 45;
const GREEN = rgb(0.07, 0.36, 0.18);
const RED = rgb(0.75, 0.15, 0.15);
const DARK = rgb(0.1, 0.1, 0.1);
const GREY = rgb(0.45, 0.45, 0.45);

const COLUMNS = [
  { label: "SN", width: 28 },
  { label: "TAX HEAD", width: 247 },
  { label: "YEAR", width: 45 },
  { label: "AMOUNT (N)", width: 85 },
  { label: "REMARK", width: 100 },
];

// The standard fonts only cover WinAnsi; anything else would throw mid-render
const clean = (text: string) => text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");

const money = (value: number) => value.toLocaleString("en-NG");

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function remarkFor(line: NoticeLine, noticeYear: number) {
  if (line.status === "paid") return "Paid";
  if (line.status === "waived") return "Nothing due";
  if (line.status === "awaiting_declaration") return "By declaration";
  if (line.year < noticeYear) return "Arrears";
  return line.code === "GIRS_PAYE" ? "Monthly" : "Annually";
}

export async function createNoticePdf(data: {
  schoolName: string;
  address: string | null;
  year: number;
  noticeNumber: string;
  issuedAt: Date;
  dueDate: Date;
  lines: NoticeLine[];
}): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  let page: PDFPage = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();
  let y = height - 34;

  const centered = (
    text: string,
    size: number,
    f: PDFFont,
    color = DARK,
  ) => {
    page.drawText(text, {
      x: (width - f.widthOfTextAtSize(text, size)) / 2,
      y,
      size,
      font: f,
      color,
    });
  };

  const paragraph = (text: string, size = 10, f = font) => {
    for (const line of wrap(clean(text), f, size, width - MARGIN * 2)) {
      page.drawText(line, { x: MARGIN, y, size, font: f, color: DARK });
      y -= size * 1.3;
    }
  };

  // ── Letterhead ────────────────────────────────────────────────────────────
  centered("SECRET", 11, bold, RED);
  y -= 58;
  const logo = await pdf.embedPng(
    fs.readFileSync(path.join(process.cwd(), "public", "gombe_logo.png")),
  );
  const logoSize = logo.scaleToFit(56, 50);
  page.drawImage(logo, {
    x: (width - logoSize.width) / 2,
    y,
    width: logoSize.width,
    height: logoSize.height,
  });
  y -= 20;
  centered("GOMBE STATE INTERNAL REVENUE SERVICE", 15, bold, GREEN);
  y -= 13;
  centered(
    "Office: Opposite Custodian Hotel, Along Gombe - Bauchi Road, Gombe, Gombe State",
    8.5,
    font,
    RED,
  );
  y -= 11;
  centered(
    "Phone: 08024945888, 09130064676, 09091363075, 09054356142   Email: irsgombe@gmail.com",
    8.5,
    font,
    RED,
  );
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1,
    color: GREEN,
  });
  y -= 18;

  // ── Addressee ─────────────────────────────────────────────────────────────
  page.drawText(data.noticeNumber, { x: MARGIN, y, size: 10, font: bold, color: DARK });
  const dateText = `Date: ${formatDate(data.issuedAt)}`;
  page.drawText(dateText, {
    x: width - MARGIN - font.widthOfTextAtSize(dateText, 10),
    y,
    size: 10,
    font,
    color: DARK,
  });
  y -= 16;
  paragraph("The Proprietor,");
  paragraph(data.schoolName, 11, bold);
  if (data.address) paragraph(data.address);
  y -= 8;

  centered("SINGLE DEMAND NOTICE", 12, bold);
  y -= 16;
  paragraph(
    "Gombe State Internal Revenue Service is a statutory body with overriding powers with respect to all Internally Generated Revenue to the state. The service is empowered to collect all relevant Taxes, Levies and Fees due to Gombe State Government. In view of this, I'm directed to inform your organization regarding Taxes/Levies payable by your organization as follows.",
  );
  y -= 6;

  // ── Table ─────────────────────────────────────────────────────────────────
  const ROW_HEIGHT = 17;
  const row = (cells: string[], f: PDFFont, shade = false) => {
    if (y - ROW_HEIGHT < 60) {
      page = pdf.addPage([595, 842]);
      y = height - MARGIN;
    }
    if (shade) {
      page.drawRectangle({
        x: MARGIN,
        y: y - ROW_HEIGHT,
        width: width - MARGIN * 2,
        height: ROW_HEIGHT,
        color: rgb(0.93, 0.95, 0.93),
      });
    }
    let x = MARGIN;
    cells.forEach((cell, i) => {
      const column = COLUMNS[i];
      page.drawRectangle({
        x,
        y: y - ROW_HEIGHT,
        width: column.width,
        height: ROW_HEIGHT,
        borderColor: DARK,
        borderWidth: 0.5,
      });
      const isAmount = i === 3;
      const textX = isAmount
        ? x + column.width - f.widthOfTextAtSize(cell, 9.5) - 5
        : x + 5;
      page.drawText(cell, { x: textX, y: y - 12, size: 9.5, font: f, color: DARK });
      x += column.width;
    });
    y -= ROW_HEIGHT;
  };

  row(COLUMNS.map((c) => c.label), bold, true);
  data.lines.forEach((line, index) => {
    row(
      [
        String(index + 1),
        clean(line.subhead_name),
        String(line.year),
        line.amount === null ? "-" : money(Number(line.amount)),
        remarkFor(line, data.year),
      ],
      font,
    );
  });
  const total = data.lines
    .filter((l) => l.status === "unpaid")
    .reduce((sum, l) => sum + Number(l.amount), 0);
  row(["", "TOTAL DUE", "", money(total), ""], bold, true);
  y -= 12;

  // ── Terms and signatory ───────────────────────────────────────────────────
  if (y < 220) {
    page = pdf.addPage([595, 842]);
    y = height - MARGIN;
  }
  paragraph(
    `You are expected to effect the payment of the above within thirty (30) days from the day you received this letter, on or before ${formatDate(data.dueDate)}, through your institution's account on the GESMS portal. However, you may wish to object to it within the stipulated time as enshrined in section 90(1) of Gombe Revenue (Codification and Consolidated) Law 2021, stating your grounds of objection.`,
  );
  paragraph(
    "Personal Income Tax and Pay As You Earn are payable on the amounts approved from your declaration, within thirty (30) days of approval.",
  );
  y -= 26;

  const signatoryTop = y;
  paragraph("NASIRU GARBA", 10.5, bold);
  paragraph("Executive Director, Tax Operation.");
  paragraph("For: Executive Chairman.");
  y -= 8;
  paragraph("NOTE: CASH PAYMENT IS PROHIBITED", 10.5, bold);
  page.drawText(
    "While looking forward to your strict compliance, please accept the assurance of the service esteem regard.",
    { x: MARGIN, y, size: 9, font, color: GREY },
  );

  // Public check that this is a genuine notice; it shows no amounts
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const qr = await QRCode.toDataURL(
    `${baseUrl}/verify-notice?number=${encodeURIComponent(data.noticeNumber)}`,
    { width: 200, margin: 1 },
  );
  const qrImage = await pdf.embedPng(Buffer.from(qr.split(",")[1], "base64"));
  page.drawImage(qrImage, {
    x: width - MARGIN - 62,
    y: signatoryTop - 54,
    width: 62,
    height: 62,
  });

  return Buffer.from(await pdf.save());
}
