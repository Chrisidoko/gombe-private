// Operator 2 approves a bulk assessment — this is where invoices are actually created.
// Mirrors the invoice-creation logic that was previously in the Op1 POST route.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: "Invalid assessment id" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch the assessment
    const asmtRes = await client.query(
      `SELECT * FROM schoolkano_bulk_assessments WHERE id = $1 AND status = 'pending_approval'`,
      [assessmentId],
    );
    if (asmtRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Assessment not found or already reviewed" },
        { status: 404 },
      );
    }
    const asmt = asmtRes.rows[0];

    // Fetch eligible schools (same logic as Op1 create)
    const schoolsRes = await client.query(`
      SELECT school_id, name, email, tier, lga
      FROM schoolskano
      WHERE approval_status = 'approved' AND tier IS NOT NULL
    `);
    const schools = schoolsRes.rows.filter((s) => {
      if (s.tier === 1 && asmt.tier_1_fee) return true;
      if (s.tier === 2 && asmt.tier_2_fee) return true;
      if (s.tier === 3 && asmt.tier_3_fee) return true;
      return false;
    });

    if (schools.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "No eligible schools found for the configured tiers" },
        { status: 400 },
      );
    }

    // Mark assessment approved
    await client.query(
      `UPDATE schoolkano_bulk_assessments
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [user.name || "operator2", assessmentId],
    );

    // Create one invoice per school
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-${String(assessmentId).padStart(4, "0")}`;

    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      const fee =
        school.tier === 1
          ? asmt.tier_1_fee
          : school.tier === 2
            ? asmt.tier_2_fee
            : asmt.tier_3_fee;
      const invoiceNumber = `${prefix}-${String(i + 1).padStart(4, "0")}`;

      await client.query(
        `INSERT INTO schoolkano_invoices
           (school_id, invoice_number, title, amount, status,
            issue_date, due_date, bulk_assessment_id, tier, is_creating_bill)
         VALUES ($1, $2, $3, $4, 'Unpaid', NOW(), $5, $6, $7, false)`,
        [
          school.school_id,
          invoiceNumber,
          asmt.title,
          fee,
          asmt.due_date || null,
          assessmentId,
          school.tier,
        ],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      assessment_id: assessmentId,
      total_invoices: schools.length,
      message: `Approved — ${schools.length} invoices sent to schools`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Op2 bulk approve failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
