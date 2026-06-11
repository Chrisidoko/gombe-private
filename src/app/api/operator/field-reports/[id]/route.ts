import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "acknowledge" && action !== "close") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    let result;

    if (action === "acknowledge") {
      result = await pool.query(
        `UPDATE inspector_field_reports
         SET status = 'acknowledged', acknowledged_at = now()
         WHERE id = $1 AND status = 'open'
         RETURNING id, status, acknowledged_at`,
        [id]
      );
    } else {
      // close: set delete_after to 30 days from now
      result = await pool.query(
        `UPDATE inspector_field_reports
         SET status = 'closed',
             closed_at = now(),
             delete_after = now() + INTERVAL '30 days'
         WHERE id = $1 AND status IN ('open', 'acknowledged')
         RETURNING id, status, closed_at, delete_after`,
        [id]
      );
    }

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Report not found or already in that state" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report: result.rows[0] });
  } catch (error) {
    console.error("Failed to update field report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
