// src/lib/formatDate.ts

export function formatDate(dateString: string | Date | null | undefined) {
  if (!dateString) return "—"; // handles null, undefined, empty string

  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) return "—"; // handles invalid date strings

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
