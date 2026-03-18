// lib/activateLicense.ts
import pool from "@/lib/db";
import { PoolClient } from "pg";

export async function activateLicense(
  client: typeof pool | PoolClient,
  school_id: string,
) {
  const prefix = "MOE/H";

  // Get highest existing number
  const result = await client.query(
    `SELECT license_number FROM schoolskano
     WHERE license_number LIKE $1
     ORDER BY license_number DESC LIMIT 1`,
    [`${prefix}/%`],
  );

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const parts = result.rows[0].license_number.split("/");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }

  // Check if school already has a license number — reuse it if so
  const existing = await client.query(
    `SELECT license_number FROM schoolskano WHERE school_id = $1`,
    [school_id],
  );

  let license_number = existing.rows[0]?.license_number;

  if (!license_number) {
    license_number = `${prefix}/${String(nextNumber).padStart(4, "0")}`;

    // Safety net
    const taken = await client.query(
      "SELECT 1 FROM schoolskano WHERE license_number = $1",
      [license_number],
    );
    if (taken.rows.length > 0) {
      license_number = `${prefix}/${String(nextNumber + 1).padStart(4, "0")}`;
    }
  }

  const issue_date = new Date();
  const expiry_date = new Date();
  expiry_date.setFullYear(expiry_date.getFullYear() + 1);

  await client.query(
    `UPDATE schoolskano
     SET license_number       = $1,
         last_license_renewal = $2,
         license_expiry_date  = $3,
         license_status       = 'Active'
     WHERE school_id = $4`,
    [
      license_number,
      issue_date.toISOString(),
      expiry_date.toISOString(),
      school_id,
    ],
  );

  return license_number;
}
