// Tax Audit — every school's liabilities across all Heads. Finance only.
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { getTaxAudit } from "@/lib/taxAudit";

export async function GET(req: Request) {
  const denied = await requireRole("CBS_Finance");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam && yearParam !== "all" ? parseInt(yearParam) : null;
  if (year !== null && isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    return NextResponse.json({ schools: await getTaxAudit(year) });
  } catch (error) {
    console.error("Tax audit report failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
