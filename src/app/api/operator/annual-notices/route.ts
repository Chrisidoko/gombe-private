// Operator 1 — see which schools are ready for a year's notice and prepare the
// batch. Nothing reaches a school until Operator 2 approves it.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { createNoticeBatch } from "@/lib/annualNotices";

async function getReadiness(year: number) {
  const { rows } = await pool.query(
    `SELECT s.school_id, s.name, s.location_type, s.premises_category
     FROM schoolskano s
     WHERE s.approval_status = 'approved'
       AND NOT EXISTS (
         SELECT 1 FROM annual_notices n
         WHERE n.school_id = s.school_id AND n.year = $1 AND n.status <> 'rejected'
       )
     ORDER BY s.name`,
    [year],
  );
  return {
    ready: rows.filter((s) => s.location_type && s.premises_category),
    missingDetails: rows.filter((s) => !s.location_type || !s.premises_category),
  };
}

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
    return NextResponse.json({
      year,
      ready,
      missingDetails,
      batches: batches.rows,
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
