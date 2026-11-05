// Which Demand Notices tabs have something waiting on the school, for the red
// dots on the tabs:
//   single — an unpaid notice line, or one still needing its declaration
//   paye   — an approved return to pay, or a finished month not yet filed
//   other  — an unpaid invoice
// The current month's PAYE doesn't count until the month is over.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { getSchoolPayeMonths } from "@/lib/paye";

export async function GET(
  _req: Request,
  context: { params: Promise<{ school_id: string }> },
) {
  const { school_id } = await context.params;
  const denied = await requireSchoolAccess(school_id, []);
  if (denied) return denied;

  try {
    const { rows } = await pool.query(
      `SELECT
         EXISTS (
           SELECT 1
           FROM annual_notice_lines l
           JOIN annual_notices n ON n.id = l.notice_id
           WHERE n.school_id = $1 AND n.status = 'issued'
             AND (
               l.status = 'unpaid'
               OR (l.status = 'awaiting_declaration' AND NOT EXISTS (
                 SELECT 1 FROM tax_declarations d
                 WHERE d.line_id = l.id AND d.status <> 'rejected'
               ))
             )
         ) AS single,
         EXISTS (
           SELECT 1 FROM schoolkano_invoices
           WHERE school_id = $1 AND status = 'Unpaid'
         ) AS other`,
      [school_id],
    );

    const thisMonth = new Date().toISOString().slice(0, 7) + "-01";
    const paye = (await getSchoolPayeMonths(school_id)).some(
      (m) =>
        m.status === "unpaid" ||
        ((!m.status || m.status === "rejected") && m.period < thisMonth),
    );

    return NextResponse.json({ ...rows[0], paye });
  } catch (error) {
    console.error("Demand notice alerts failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
