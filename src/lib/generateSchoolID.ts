import pool from "@/lib/db";
import {
  STATE_CODE,
  LGA_CODES,
  CATEGORY_CODES,
  findLGA,
  findCategory,
} from "@/lib/schoolIdConstants";

const MAX_ATTEMPTS = 20;

/**
 * Generates a unique school ID: STATE-LGA-TYPE-NUMBER, e.g. "GM-AKK-UNI-4821".
 * New IDs only — existing schools keep their old INITIALS-001 style IDs.
 */
export async function generateSchoolID(
  lga: string,
  category: string,
): Promise<string> {
  const matchedLGA = findLGA(lga);
  if (!matchedLGA) {
    throw new Error(`Unknown LGA: "${lga}"`);
  }

  const matchedCategory = findCategory(category);
  if (!matchedCategory) {
    throw new Error(`Unknown school category: "${category}"`);
  }

  const lgaCode = LGA_CODES[matchedLGA];
  const categoryCode = CATEGORY_CODES[matchedCategory];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const number = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    const candidate = `${STATE_CODE}-${lgaCode}-${categoryCode}-${number}`;

    const existing = await pool.query(
      `SELECT 1 FROM schoolskano WHERE school_id = $1`,
      [candidate],
    );

    if (existing.rows.length === 0) return candidate;
  }

  throw new Error(
    "Could not generate a unique school ID after multiple attempts.",
  );
}
