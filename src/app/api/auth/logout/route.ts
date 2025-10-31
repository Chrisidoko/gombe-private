import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  return response;
}

//use this in frontend for log out
// await fetch("/api/auth/logout", { method: "POST" });
// router.push("/login");
