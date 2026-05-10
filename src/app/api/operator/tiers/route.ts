// app/api/operator/tiers/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ── GET — fetch all schools grouped by tier ───────────────────────────────────
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        school_id,
        name,
        lga,
        state,
        programmes,
        license_status,
        tier
      FROM schoolskano
      WHERE approval_status = 'approved'
      ORDER BY name ASC
    `);

    const tier1 = result.rows.filter((s) => s.tier === 1);
    const tier2 = result.rows.filter((s) => s.tier === 2);
    const tier3 = result.rows.filter((s) => s.tier === 3);
    const unassigned = result.rows.filter((s) => !s.tier);

    return NextResponse.json({ tier1, tier2, tier3, unassigned });
  } catch (error) {
    console.error("Tiers fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch tiers" },
      { status: 500 },
    );
  }
}

// ── PATCH — update a school's tier ────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const { school_id, tier } = await req.json();

    if (!school_id) {
      return NextResponse.json(
        { error: "school_id is required" },
        { status: 400 },
      );
    }

    // tier can be 1, 2, 3 or null (unassign)
    if (tier !== null && ![1, 2, 3].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be 1, 2, 3 or null" },
        { status: 400 },
      );
    }

    await pool.query(`UPDATE schoolskano SET tier = $1 WHERE school_id = $2`, [
      tier,
      school_id,
    ]);

    return NextResponse.json({ success: true, school_id, tier });
  } catch (error) {
    console.error("Tier update failed:", error);
    return NextResponse.json(
      { error: "Failed to update tier" },
      { status: 500 },
    );
  }
}

// ── POST — bulk assign tier to multiple schools ───────────────────────────────
export async function POST(req: Request) {
  try {
    const { school_ids, tier } = await req.json();

    if (!school_ids?.length) {
      return NextResponse.json(
        { error: "school_ids array is required" },
        { status: 400 },
      );
    }

    await pool.query(
      `UPDATE schoolskano SET tier = $1 WHERE school_id = ANY($2)`,
      [tier, school_ids],
    );

    return NextResponse.json({
      success: true,
      updated: school_ids.length,
      tier,
    });
  } catch (error) {
    console.error("Bulk tier update failed:", error);
    return NextResponse.json(
      { error: "Failed to bulk update tiers" },
      { status: 500 },
    );
  }
}
