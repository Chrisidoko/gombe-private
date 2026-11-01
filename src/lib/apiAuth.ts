// Middleware lets every /api request through, so each route handler has to
// check the caller itself. Each helper returns the response to send back when
// access is denied, or null when the caller may continue:
//
//   const denied = await requireRole("CBS_Admin");
//   if (denied) return denied;
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export const ALL_STAFF = [
  "CBS_Admin",
  "CBS_Finance",
  "CBS_Operator",
  "CBS_Operator2",
  "CBS_Inspector",
];

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function requireLogin() {
  const user = await getUserFromCookie();
  return user?.institution ? null : unauthorized();
}

export async function requireRole(...roles: string[]) {
  const user = await getUserFromCookie();
  if (!user?.institution) return unauthorized();
  return roles.includes(user.institution) ? null : forbidden();
}

// A school account's institution is its school_id, so a school only ever
// matches its own records. Staff need to be in staffRoles.
export async function requireSchoolAccess(
  schoolId: string | null | undefined,
  staffRoles: string[] = ALL_STAFF,
) {
  const user = await getUserFromCookie();
  if (!user?.institution) return unauthorized();
  if (user.institution === schoolId) return null;
  return staffRoles.includes(user.institution) ? null : forbidden();
}

// The registration routes stay public because a school has no login yet. Once
// approved, its record must only change through its own authenticated profile.
export async function rejectIfApproved(where: {
  school_id?: string | null;
  tin?: string | null;
}) {
  const { rows } = await pool.query(
    `SELECT 1 FROM schoolskano
     WHERE approval_status = 'approved'
       AND (school_id = $1 OR tin = $2)
     LIMIT 1`,
    [where.school_id ?? null, where.tin ?? null],
  );
  return rows.length > 0 ? forbidden() : null;
}
