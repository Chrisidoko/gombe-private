// app/api/admin/staff-accounts/[id]/route.ts
//
// Disable/re-enable a staff account. Reuses the exact gate
// /api/auth/login already enforces (`status !== "approved"` blocks login)
// rather than adding a second mechanism — flipping status to "disabled"
// here is immediately effective with no other changes.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

const STAFF_INSTITUTIONS = [
  "CBS_Admin",
  "CBS_Finance",
  "CBS_Inspector",
  "CBS_Operator",
  "CBS_Operator2",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getUserFromCookie();
  if (!admin || admin.institution !== "CBS_Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const accountId = parseInt(id, 10);
  if (isNaN(accountId)) {
    return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
  }

  try {
    const { status } = await req.json();
    if (status !== "approved" && status !== "disabled") {
      return NextResponse.json(
        { error: 'status must be "approved" or "disabled"' },
        { status: 400 },
      );
    }

    // Guard against an admin locking themselves out with nobody left to
    // re-enable them.
    if (status === "disabled" && admin.id === accountId) {
      return NextResponse.json(
        { error: "You cannot disable your own account." },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `UPDATE userskano
       SET status = $1
       WHERE id = $2 AND institution = ANY($3)
       RETURNING id, name, email, institution, status, created_at`,
      [status, accountId, STAFF_INSTITUTIONS],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Staff account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ account: result.rows[0] });
  } catch (error) {
    console.error("Update staff account status failed:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}
