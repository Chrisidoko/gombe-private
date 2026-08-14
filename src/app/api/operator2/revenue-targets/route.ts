// Operator 2 — view/set quarterly revenue targets
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
  );

  try {
    const result = await pool.query(
      `SELECT id, year, quarter, target, notes, created_by, created_at, updated_at
       FROM revenue_targets
       WHERE year = $1
       ORDER BY quarter ASC`,
      [year],
    );
    return NextResponse.json({ year, targets: result.rows });
  } catch (error) {
    console.error("Revenue targets fetch failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { year, quarter, target, notes } = await req.json();

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(quarter) ||
      quarter < 1 ||
      quarter > 4 ||
      typeof target !== "number" ||
      target < 0
    ) {
      return NextResponse.json(
        { error: "Invalid year, quarter, or target" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `INSERT INTO revenue_targets (year, quarter, target, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (year, quarter)
       DO UPDATE SET target = $3, notes = $4, updated_at = NOW()
       RETURNING id, year, quarter, target, notes, created_by, created_at, updated_at`,
      [year, quarter, target, notes || null, user.name || "operator2"],
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Revenue target save failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
