// /api/schools/register.ts this not in use right now
import { NextResponse } from "next/server";
import client from "@/lib/db"; // your pg client

export async function POST(req: Request) {
  try {
    const { tin, formStatus } = await req.json();

    if (!tin) {
      return NextResponse.json(
        { success: false, error: "TIN is required" },
        { status: 400 }
      );
    }

    const result = await client.query(
      `UPDATE schoolskano
       SET form_status = $1
       WHERE tin = $2`,
      [formStatus, tin]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "No record found for this TIN" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Database update failed:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
