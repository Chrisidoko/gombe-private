// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

const protectedRoutes = [
  "/dashboard",
  "/reports",
  "/home",
  "/assessment",
  "/fees",
  "/history",
];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const url = req.nextUrl.pathname;

  // Public routes
  if (
    url.startsWith("/login") ||
    url.startsWith("/signup") ||
    url.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Skip if not protected
  const isProtected = protectedRoutes.some((path) => url.startsWith(path));
  if (!isProtected) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    // Verify token using jose
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Role-based route protection
    if (payload.role === "school" && url.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    if (payload.role === "admin" && url.startsWith("/home")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
