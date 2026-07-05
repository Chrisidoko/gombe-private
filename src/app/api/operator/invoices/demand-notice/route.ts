// Operator 1 submits a demand notice for review.
// The notice is staged in pending_demand_notices — no invoice, no PayKaduna call,
// no email until Operator 2 approves via /api/operator2/demand-notices/[id]/approve.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { school_id, title, amount, narration } = body;

    if (!school_id || !title?.trim() || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Fetch school info for display in Op2's review queue
    const schoolRes = await pool.query(
      "SELECT name, email FROM schoolskano WHERE school_id = $1",
      [school_id],
    );
    const school = schoolRes.rows[0];
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { rows } = await pool.query(
      `INSERT INTO pending_demand_notices
         (school_id, school_name, school_email, title, amount, narration, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        school_id,
        school.name,
        school.email,
        title.trim(),
        parsedAmount,
        narration?.trim() || null,
        user.name || "operator",
      ],
    );

    return NextResponse.json({
      success: true,
      notice: {
        id: rows[0].id,
        title: title.trim(),
        amount: parsedAmount,
        school_name: school.name,
        created_at: rows[0].created_at,
      },
      message: "Demand notice submitted for Operator 2 review",
    });
  } catch (error) {
    console.error("Demand notice staging failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — Op1 can see their own submitted notices and their statuses
export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM pending_demand_notices ORDER BY created_at DESC`,
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Demand notices fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
