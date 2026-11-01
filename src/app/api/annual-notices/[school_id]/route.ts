// A school's issued notices and their lines, for the school and for staff.
import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { getSchoolNotices } from "@/lib/annualNotices";
import { reconcileNoticeLine } from "@/lib/reconcileEtransact";

export async function GET(
  _req: Request,
  context: { params: Promise<{ school_id: string }> },
) {
  const { school_id } = await context.params;

  const denied = await requireSchoolAccess(school_id);
  if (denied) return denied;

  try {
    let lines = await getSchoolNotices(school_id);

    // Same catch-up as the fees and invoices routes, for a payment completed
    // after the payer closed the checkout tab.
    let changed = false;
    for (const line of lines) {
      if (line.status !== "unpaid" || !line.reference) continue;
      try {
        const { isPaid } = await reconcileNoticeLine(line.id);
        changed = changed || isPaid;
      } catch (err) {
        console.error(`Reconcile check failed for notice line ${line.id}:`, err);
      }
    }
    if (changed) lines = await getSchoolNotices(school_id);

    return NextResponse.json({ lines });
  } catch (error) {
    console.error("Annual notices fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
