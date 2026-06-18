// app/api/operator/bulk/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ── GET — fetch all schoolkano_bulk_assessments with invoice counts ───────────────────────────
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        a.*,
        COUNT(i.id)                                     AS total_invoices,
        COUNT(i.id) FILTER (WHERE i.status = 'Paid')   AS paid_count,
        COUNT(i.id) FILTER (WHERE i.status = 'Unpaid') AS unpaid_count
      FROM schoolkano_bulk_assessments a
      LEFT JOIN schoolkano_invoices i ON i.bulk_assessment_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);

    return NextResponse.json(result.rows);
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
  const client = await pool.connect();
  try {
    const {
      title,
      description,
      tier_1_fee,
      tier_2_fee,
      tier_3_fee,
      due_date,
      created_by,
    } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
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

    // ── Create assessment record ──────────────────────────────────────────
    const assessmentResult = await client.query(
      `INSERT INTO schoolkano_bulk_assessments
         (title, description, tier_1_fee, tier_2_fee, tier_3_fee,
          total_schools, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')
       RETURNING id`,
      [
        title,
        description || null,
        tier_1_fee || null,
        tier_2_fee || null,
        tier_3_fee || null,
        schools.length,
        created_by || "admin",
      ],
    );

    const assessmentId = assessmentResult.rows[0].id;
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-${String(assessmentId).padStart(4, "0")}`;

    // ── Bulk insert one invoice per school ────────────────────────────────
    // bulk_assessment_id must be set on each invoice to satisfy the
    // "only_one_assessment_check" constraint on schoolkano_invoices. The three
    // valid invoice origins are:
    //   • assessment_id set      → individual self-assessment (approve route)
    //   • bulk_assessment_id set → operator bulk assessment (this route)
    //   • both NULL              → direct demand notice (demand-notice route,
    //                              allowed after the constraint was relaxed)
    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      const fee =
        school.tier === 1
          ? tier_1_fee
          : school.tier === 2
            ? tier_2_fee
            : tier_3_fee;
      const invoiceNumber = `${prefix}-${String(i + 1).padStart(4, "0")}`;

      await client.query(
        `INSERT INTO schoolkano_invoices
           (school_id, invoice_number, title, amount, status,
            issue_date, due_date, bulk_assessment_id, tier, is_creating_bill)
         VALUES ($1, $2, $3, $4, 'Unpaid', NOW(), $5, $6, $7, false)`,
        [
          school.school_id,
          invoiceNumber,
          title,
          fee,
          due_date || null,
          assessmentId,
          school.tier,
        ],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      assessment_id: assessmentId,
      total_schools: schools.length,
      total_invoices: schools.length,
      message: `Assessment created — ${schools.length} invoices generated successfully`,
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
