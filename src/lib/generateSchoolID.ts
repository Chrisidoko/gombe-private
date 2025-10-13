import pool from "@/lib/db";

/**
 * Generates a unique school ID based on the school's official name.
 * Example: "Shehu Usman Dan Fodio University" -> "SUDFU-001"
 */
export async function generateSchoolID(officialName: string): Promise<string> {
  // Extract all initials from the school name
  const initials = officialName
    .split(" ")
    .map((word) => word[0]?.toUpperCase())
    .join("");

  // Find how many schools already share the same prefix
  const existing = await pool.query(
    `SELECT COUNT(*) FROM schoolskano WHERE school_id LIKE $1`,
    [`${initials}-%`]
  );

  // Generate sequential number (001, 002, etc.)
  const nextNumber = String(Number(existing.rows[0].count) + 1).padStart(
    3,
    "0"
  );

  // Combine initials and number
  return `${initials}-${nextNumber}`;
}
