// app/api/operator/bulk/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { COUNTS_SQL, HISTORY_PAGE_SIZE, readHistoryParams } from "@/lib/historyPage";

const DEFAULT_PAYMENT_DAYS = 30;

// ── GET — one page of bulk assessments with invoice counts ────────────────────
// See lib/historyPage.ts for the status, page and q params.
export async function GET(req: Request) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const { page, offset, search, statuses, tab } = readHistoryParams(req);

  try {
    const counts = await pool.query(
      `SELECT ${COUNTS_SQL} FROM schoolkano_bulk_assessments
       WHERE ($1 = '' OR title ILIKE $1)`,
      [search],
    );
    const result = await pool.query(
      `SELECT
        a.*,
        COUNT(i.id)                                     AS total_invoices,
        COUNT(i.id) FILTER (WHERE i.status = 'Paid')   AS paid_count,
        COUNT(i.id) FILTER (WHERE i.status = 'Unpaid') AS unpaid_count
      FROM schoolkano_bulk_assessments a
      LEFT JOIN schoolkano_invoices i ON i.bulk_assessment_id = a.id
      WHERE ($1 = '' OR a.title ILIKE $1) AND ($2::text[] IS NULL OR a.status = ANY($2))
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT $3 OFFSET $4`,
      [search, statuses, HISTORY_PAGE_SIZE, offset],
    );

    return NextResponse.json({
      items: result.rows,
      counts: counts.rows[0],
      total: counts.rows[0][tab],
      page,
      pageSize: HISTORY_PAGE_SIZE,
    });
  } catch (error) {
    console.error("Assessments fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 },
    );
  }
}

// ── POST — create assessment + bulk insert invoices ───────────────────────────
export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const {
      title,
      description,
      tier_1_fee,
      tier_2_fee,
      tier_3_fee,
      payment_days,
    } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Days schools get to pay, counted from Operator 2's approval
    const paymentDays = Number(payment_days ?? DEFAULT_PAYMENT_DAYS);
    if (!Number.isInteger(paymentDays) || paymentDays < 1 || paymentDays > 365) {
      return NextResponse.json(
        { error: "Days to pay must be a whole number from 1 to 365" },
        { status: 400 },
      );
    }

    if (!tier_1_fee && !tier_2_fee && !tier_3_fee) {
      return NextResponse.json(
        { error: "At least one tier fee is required" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // ── Fetch all approved schools with a tier assigned ───────────────────
    const schoolsResult = await client.query(`
      SELECT school_id, name, email, tier, lga
      FROM schoolskano
      WHERE approval_status = 'approved'
        AND tier IS NOT NULL
    `);

    // Keep only schools whose tier has a fee set
    const schools = schoolsResult.rows.filter((s) => {
      if (s.tier === 1 && tier_1_fee) return true;
      if (s.tier === 2 && tier_2_fee) return true;
      if (s.tier === 3 && tier_3_fee) return true;
      return false;
    });

    if (schools.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error:
            "No schools found for the selected tiers. Make sure schools are assigned to tiers first.",
        },
        { status: 400 },
      );
    }

    // ── Create assessment record — status pending_approval until Op2 approves ─
    const assessmentResult = await client.query(
      `INSERT INTO schoolkano_bulk_assessments
         (title, description, tier_1_fee, tier_2_fee, tier_3_fee,
          total_schools, created_by, status, payment_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_approval', $8)
       RETURNING id`,
      [
        title,
        description || null,
        tier_1_fee || null,
        tier_2_fee || null,
        tier_3_fee || null,
        schools.length,
        user.name || "operator",
        paymentDays,
      ],
    );

    const assessmentId = assessmentResult.rows[0].id;

    // Invoices are NOT created here. They are created by Operator 2 when
    // approving via PATCH /api/operator2/bulk/[id]/approve.

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      assessment_id: assessmentId,
      total_schools: schools.length,
      message: `Assessment submitted for review — ${schools.length} schools pending Operator 2 approval`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assessment creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
