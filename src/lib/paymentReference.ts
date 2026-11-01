// lib/paymentReference.ts
// We mint our own reference so it can be handed to whichever payment gateway
// is in use. Checked against every table that can feed the ledger.
import crypto from "crypto";
import pool from "@/lib/db";

const REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const REFERENCE_LENGTH = 10;
const MAX_REFERENCE_ATTEMPTS = 20;

function randomReference(): string {
  let ref = "";
  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    ref += REFERENCE_CHARS[crypto.randomInt(REFERENCE_CHARS.length)];
  }
  return ref;
}

export async function generateUniquePaymentReference(): Promise<string> {
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt++) {
    const candidate = randomReference();
    const existing = await pool.query(
      `SELECT 1 FROM schoolkano_payments WHERE reference = $1
       UNION ALL
       SELECT 1 FROM annual_notice_lines WHERE reference = $1
       UNION ALL
       SELECT 1 FROM transactionskano WHERE reference = $1
       LIMIT 1`,
      [candidate],
    );
    if (existing.rows.length === 0) return candidate;
  }
  throw new Error(
    "Could not generate a unique payment reference after multiple attempts.",
  );
}
