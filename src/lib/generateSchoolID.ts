import pool from "@/lib/db";

/**
 * Generates a unique school ID based on the school's official name.
 * Example: "Shehu Usman Dan Fodio University" -> "SUDFU-001"
 */
export async function generateSchoolID(officialName: string): Promise<string> {
  // Extract initials — only from words that start with a letter (strips &, numbers etc.)
  const initials = officialName
    .split(" ")
    .filter((word) => /^[a-zA-Z]/.test(word)) // ← skip words starting with & or numbers
    .map((word) => word[0]?.toUpperCase())
    .join("");

  // Find how many schools already share the same prefix
  const existing = await pool.query(
    `SELECT COUNT(*) FROM schoolskano WHERE school_id LIKE $1`,
    [`${initials}-%`],
  );

  // Generate sequential number (001, 002, etc.)
  const nextNumber = String(Number(existing.rows[0].count) + 1).padStart(
    3,
    "0",
  );

  return `${initials}-${nextNumber}`;
}
