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
    url.startsWith("/payment-success") || // ← public
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

    const institution = payload.institution as string;

    // ── Determine role from institution value ───────────────────────────────
    // "CBS_Admin"  → admin
    // "CBS_Finance" → finance (new)
    // "CBS_Inspector" → inspector (new)
    // anything else → school (institution = school_id)
    const isAdmin = institution === "CBS_Admin";
    const isFinance = institution === "CBS_Finance";
    const isInspector = institution === "CBS_Inspector";
    const isOperator = institution === "CBS_Operator";
    const isOperator2 = institution === "CBS_Operator2";
    const isSchool = !isAdmin && !isFinance && !isInspector && !isOperator && !isOperator2;

    // ── Helper — where to redirect a non-authorised user ─────────────────
    function defaultRedirect() {
      if (isAdmin) return "/dashboard";
      if (isFinance) return "/finance";
      if (isInspector) return "/inspector";
      if (isOperator) return "/operator-Invoices";
      if (isOperator2) return "/review-bulk";
      return "/home"; // school
    }

    // ── Admin routes — /dashboard ───────────────────────────────────────────
    if (
      url.startsWith("/dashboard") ||
      url.startsWith("/requests") ||
      url.startsWith("/institutions") ||
      url.startsWith("/questionnaires") ||
      url.startsWith("/create-school") ||
      url.startsWith("/accounts")
    ) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL(defaultRedirect(), req.url));
      }
      return NextResponse.next();
    }

    // ── Operator routes ───────────────────────────────────────────
    if (
      url.startsWith("/evaluations") ||
      url.startsWith("/ministry-assessment") ||
      url.startsWith("/operator-Invoices") ||
      url.startsWith("/bulk-assessment") ||
      url.startsWith("/tiers") ||
      url.startsWith("/records")
    ) {
      if (!isOperator) {
        return NextResponse.redirect(new URL(defaultRedirect(), req.url));
      }
      return NextResponse.next();
    }

    // ── Operator 2 routes ─────────────────────────────────────────────────
    if (
      url.startsWith("/review-bulk") ||
      url.startsWith("/review-evaluations") ||
      url.startsWith("/review-demand-notices")
    ) {
      if (!isOperator2) {
        return NextResponse.redirect(new URL(defaultRedirect(), req.url));
      }
      return NextResponse.next();
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
        return NextResponse.redirect(new URL(defaultRedirect(), req.url));
      }
      return NextResponse.next();
    }

    // ── Finance routes — /finance ───────────────────────────────────────────
    if (
      url.startsWith("/finance") ||
      url.startsWith("/collections") ||
      url.startsWith("/transactions")
    ) {
      if (!isFinance) {
        return NextResponse.redirect(new URL(defaultRedirect(), req.url));
      }
      return NextResponse.next();
    }

    // ── Inspector routes — /inspector ─────────────────────────────────────
    if (
      url.startsWith("/inspector") ||
      url.startsWith("/create") ||
      url.startsWith("/inspector-report")
    ) {
      if (!isInspector)
        return NextResponse.redirect(new URL(defaultRedirect(), req.url));
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|pdf|docx|woff2?)$).*)",
  ],
};
