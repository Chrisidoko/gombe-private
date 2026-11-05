// Operator 1 — see which schools are ready for a year's notice and prepare the
// batch as a draft. Operator 1 checks each school's lines, adjusts any that
// need it, then sends the batch to Operator 2. Nothing reaches a school until
// Operator 2 approves it.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { createNoticeBatch, getReadiness } from "@/lib/annualNotices";

export async function GET(req: Request) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
  );

  try {
    const { ready, missingDetails } = await getReadiness(year);
    const batches = await pool.query(
      `SELECT b.id, b.year, b.source, b.status, b.created_by, b.rejection_reason, b.created_at,
              COUNT(n.id) AS school_count
       FROM annual_notice_batches b
       LEFT JOIN annual_notices n ON n.batch_id = b.id
       WHERE b.year = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [year],
    );
    // Lines of batches not yet issued, so Operator 1 sees what each school
    // will be billed (and can adjust drafts)
    const lines = await pool.query(
      `SELECT n.batch_id, n.school_id, sc.name AS school_name,
              sc.location_type, sc.premises_category,
              l.id, l.amount, l.standard_amount, l.adjustment_reason, l.adjusted_by,
              s.name AS subhead_name, s.charge_type, h.name AS head_name
       FROM annual_notice_batches b
       JOIN annual_notices n ON n.batch_id = b.id
       JOIN annual_notice_lines l ON l.notice_id = n.id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       JOIN revenue_heads h ON h.id = s.head_id
       LEFT JOIN schoolskano sc ON sc.school_id = n.school_id
       WHERE b.year = $1 AND b.status IN ('draft', 'pending_approval')
       ORDER BY sc.name, h.sort_order, s.sort_order`,
      [year],
    );
    return NextResponse.json({
      year,
      ready,
      missingDetails,
      batches: batches.rows.map((b) => ({
        ...b,
        lines: lines.rows.filter((l) => l.batch_id === b.id),
      })),
    });
  } catch (error) {
    console.error("Annual notice readiness fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { year } = await req.json();
  if (!Number.isInteger(year) || year < 2026) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const draft = await pool.query(
      `SELECT 1 FROM annual_notice_batches WHERE year = $1 AND status = 'draft'`,
      [year],
    );
    if (draft.rows.length > 0) {
      return NextResponse.json(
        { error: "Send or discard the existing draft first" },
        { status: 409 },
      );
    }

    const { ready } = await getReadiness(year);
    if (ready.length === 0) {
      return NextResponse.json(
        { error: "No schools are ready for a notice this year" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");
    const batch = await createNoticeBatch(client, {
      year,
      schools: ready,
      source: "operator",
      createdBy: user?.name || "operator",
    });
    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      batch_id: batch?.batchId ?? null,
      total_schools: batch?.created ?? 0,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Annual notice preparation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
