// Shared constants for building school IDs: State/LGA/Type/Number
// Client-safe (no server-only imports) so forms can reuse the same lists.

export const STATE_CODE = "GM"; // Gombe State — this deployment is Gombe-only

export const GOMBE_LGAS = [
  "Akko",
  "Balanga",
  "Billiri",
  "Dukku",
  "Funakaye",
  "Gombe",
  "Kaltungo",
  "Kwami",
  "Nafada",
  "Shongom",
  "Yamaltu/Deba",
] as const;

export type GombeLGA = (typeof GOMBE_LGAS)[number];

export const LGA_CODES: Record<GombeLGA, string> = {
  Akko: "AKK",
  Balanga: "BAL",
  Billiri: "BIL",
  Dukku: "DUK",
  Funakaye: "FUN",
  Gombe: "GOM",
  Kaltungo: "KAL",
  Kwami: "KWA",
  Nafada: "NAF",
  Shongom: "SHO",
  "Yamaltu/Deba": "YAM",
};

export const SCHOOL_CATEGORIES = [
  "University",
  "Polytechnic",
  "College",
  "School of Health Technology",
  "Exam Center",
] as const;

export type SchoolCategory = (typeof SCHOOL_CATEGORIES)[number];

export const CATEGORY_CODES: Record<SchoolCategory, string> = {
  University: "UNI",
  Polytechnic: "POL",
  College: "COL",
  "School of Health Technology": "SHT",
  "Exam Center": "EXC",
};

export function findLGA(value: string): GombeLGA | undefined {
  const normalized = value.trim().toLowerCase();
  return GOMBE_LGAS.find((lga) => lga.toLowerCase() === normalized);
}

export function findCategory(value: string): SchoolCategory | undefined {
  return SCHOOL_CATEGORIES.find((category) => category === value);
}
