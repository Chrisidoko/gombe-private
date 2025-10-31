import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token)
    return NextResponse.json(
      { error: "Invalid or missing token" },
      { status: 400 }
    );

  try {
    const result = await pool.query(
      `UPDATE userskano 
     SET 
       is_verified = true,
       status = 'approved',
       verification_token = NULL
     WHERE verification_token = $1
     RETURNING email`,
      [token]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}verification-success`
    );
  } catch (error) {
    console.error("Verification failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
