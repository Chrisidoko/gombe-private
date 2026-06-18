import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

const KEY = "assessment_window_open";

// Public — school assessment page reads this to decide whether to show the
// form or the locked overlay.
export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM system_settings WHERE key = $1",
      [KEY],
    );
    const open = rows.length > 0 ? rows[0].value === "true" : false;
    return NextResponse.json({ open });
  } catch (error) {
    console.error("Failed to read assessment window setting:", error);
    return NextResponse.json({ open: false }, { status: 500 });
  }
}

// Operator only — toggles the window open or closed.
export async function PATCH(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { open } = await req.json();
  if (typeof open !== "boolean") {
    return NextResponse.json(
      { error: "Body must contain { open: boolean }" },
      { status: 400 },
    );
  }

  try {
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [KEY, String(open)],
    );
    return NextResponse.json({ open });
  } catch (error) {
    console.error("Failed to update assessment window setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 },
    );
  }
}
