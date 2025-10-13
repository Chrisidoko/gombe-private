// src/lib/formatDate.ts

export function formatDate(dateInput: string | Date, locale: string = "en-US") {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
