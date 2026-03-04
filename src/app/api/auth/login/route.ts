import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    // 1️⃣ Check if user exists
    const userResult = await pool.query(
      `SELECT id, name, email, institution, password_hash, status 
       FROM userskano WHERE email = $1`,
      [email],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = userResult.rows[0];

    // 2️⃣ Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // 3️⃣ Check if account is approved
    if (user.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is pending approval. Please wait for your institution to verify your account.",
        },
        { status: 403 },
      );
    }
    // 👇 Convert secret to Uint8Array
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    // 4️⃣ Create JWT (using jose)

    // ── Derive role from institution ──────────────────────────────────────
    const role =
      user.institution === "CBS_Admin"
        ? "admin"
        : user.institution === "CBS_Finance"
          ? "finance"
          : "school";

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: role,
      institution: user.institution,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // 5️⃣ Set cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        institution: user.institution,
        role,
      },
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
