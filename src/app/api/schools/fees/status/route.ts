// A school's compliance score. See src/lib/compliance.ts for how it's worked
// out before and after approval.
import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { getActionItems, getComplianceStatus } from "@/lib/compliance";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");

    const denied = await requireSchoolAccess(school_id);
    if (denied) return denied;

    if (!school_id) {
      return NextResponse.json(
        { error: "school_id is required" },
        { status: 400 },
      );
    }

    const status = await getComplianceStatus(school_id);
    if (!status) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const [nextAction = null] = await getActionItems(school_id);
    return NextResponse.json({ ...status, nextAction });
  } catch (error) {
    console.error("Compliance fetch failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
