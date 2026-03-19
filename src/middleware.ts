// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const url = req.nextUrl.pathname;

  // ── Public routes — always allow ─────────────────────────────────────────
  if (
    url.startsWith("/login") ||
    url.startsWith("/signup") ||
    url.startsWith("/api") ||
    url.startsWith("/verify") || // ← public
    url.startsWith("/school-overview") || // ← public
    url.startsWith("/forgot-password") || // ← public
    url.startsWith("/reset-password") || // ← public
    url === "/"
  ) {
    return NextResponse.next();
  }

  // ── No token — redirect to login ─────────────────────────────────────────
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const role = payload.role as string;
    const institution = payload.institution as string;

    // ── Determine role from institution value ───────────────────────────────
    // "CBS_Admin"  → admin
    // "CBS_Finance" → finance (new)
    // anything else → school (institution = school_id)
    const isAdmin = institution === "CBS_Admin";
    const isFinance = institution === "CBS_Finance";
    const isSchool = !isAdmin && !isFinance;

    // ── Admin routes — /dashboard ───────────────────────────────────────────
    if (url.startsWith("/dashboard")) {
      if (!isAdmin) {
        return NextResponse.redirect(
          new URL(isFinance ? "/finance" : "/home", req.url),
        );
      }
    }

    // ── School routes — /home, /assessment, /fees, /history, /reports ──────
    if (
      url.startsWith("/home") ||
      url.startsWith("/assessment") ||
      url.startsWith("/fees") ||
      url.startsWith("/history") ||
      url.startsWith("/reports")
    ) {
      if (!isSchool) {
        return NextResponse.redirect(
          new URL(isAdmin ? "/dashboard" : "/finance", req.url),
        );
      }
    }

    // ── Finance routes — /finance ───────────────────────────────────────────
    if (url.startsWith("/finance")) {
      if (!isFinance) {
        return NextResponse.redirect(
          new URL(isAdmin ? "/dashboard" : "/home", req.url),
        );
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
