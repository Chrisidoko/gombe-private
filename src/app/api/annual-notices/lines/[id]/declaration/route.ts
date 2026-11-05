// A school declares its Income Tax or PAYE for a notice line. For Income Tax
// the school gives its total income and the tax is worked out from the bands;
// for PAYE it gives the tax amount itself.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { assessPit, PIT_SUBHEAD_CODE } from "@/lib/pitBands";
import { getUserFromCookie } from "@/lib/auth";
import { requireSchoolAccess } from "@/lib/apiAuth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lineId = parseInt(id, 10);
  if (isNaN(lineId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT l.status, n.school_id, n.year, n.status AS notice_status, s.code
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }

    const denied = await requireSchoolAccess(line.school_id, []);
    if (denied) return denied;

    if (line.notice_status !== "issued" || line.status !== "awaiting_declaration") {
      return NextResponse.json(
        { error: "This item is not open for declaration" },
        { status: 400 },
      );
    }

    const { amount, evidence_url, note } = await req.json();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || amount === "") {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const isPit = line.code === PIT_SUBHEAD_CODE;
    const declaredIncome = isPit ? parsedAmount : null;
    const tax = isPit ? assessPit(parsedAmount, line.year).tax : parsedAmount;

    // Must be a file this school uploaded, not any URL
    const evidence = await pool.query(
      `SELECT 1 FROM schoolkano_documents WHERE school_id = $1 AND file_url = $2`,
      [line.school_id, evidence_url ?? ""],
    );
    if (evidence.rows.length === 0) {
      return NextResponse.json(
        { error: "Upload your supporting evidence" },
        { status: 400 },
      );
    }

    const user = await getUserFromCookie();
    const result = await pool.query(
      `INSERT INTO tax_declarations
         (line_id, school_id, amount, declared_income, evidence_url, note, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (line_id) WHERE status <> 'rejected' DO NOTHING
       RETURNING id`,
      [
        lineId,
        line.school_id,
        tax,
        declaredIncome,
        evidence_url,
        note?.trim() || null,
        user?.name || "school",
      ],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "A declaration for this item is already under review" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tax declaration failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
