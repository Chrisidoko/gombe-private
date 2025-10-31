import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user || !user.institution) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();

    const {
      population_100,
      population_200,
      population_300,
      population_400,
      population_500,
      population_postgrad,
      fee_100,
      fee_200,
      fee_300,
      fee_400,
      fee_500,
      fee_postgrad,
      session,
      start_date,
      end_date,
    } = data;

    // 1️⃣ Calculate total revenue
    const totalRevenue =
      population_100 * fee_100 +
      population_200 * fee_200 +
      population_300 * fee_300 +
      population_400 * fee_400 +
      population_500 * fee_500 +
      population_postgrad * fee_postgrad;

    // 2️⃣ Calculate 5% commission
    const commission = totalRevenue * 0.05;

    // 3️⃣ Insert record into school_assessments
    await pool.query(
      `INSERT INTO schoolskano_assessments (
        school_id,
        population_100, population_200, population_300,
        population_400, population_500, population_postgrad,
        fee_100, fee_200, fee_300, fee_400, fee_500, fee_postgrad,
        session, start_date, end_date, total_revenue, commission_amount, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, 'pending'
      )`,
      [
        user.institution,
        population_100,
        population_200,
        population_300,
        population_400,
        population_500,
        population_postgrad,
        fee_100,
        fee_200,
        fee_300,
        fee_400,
        fee_500,
        fee_postgrad,
        session,
        start_date,
        end_date,
        totalRevenue,
        commission,
      ]
    );

    // 4️⃣ Update schoolskano form_status to "completed"
    // await pool.query(
    //   `UPDATE schoolskano SET form_status = 'completed' WHERE school_id = $1`,
    //   [user.institution]
    // );

    return NextResponse.json({
      success: true,
      message: "Assessment submitted successfully.",
      totalRevenue,
      commission,
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
