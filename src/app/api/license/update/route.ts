// simplified to just call this lib function that handles the entire license activation flow, including DB updates and error handling. This keeps the route handler clean and focused on just receiving the request and sending the response.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { activateLicense } from "@/lib/activateLicense";

export async function POST(req: Request) {
  const { school_id } = await req.json();
  const license_number = await activateLicense(pool, school_id);
  return NextResponse.json({ success: true, license_number });
}
