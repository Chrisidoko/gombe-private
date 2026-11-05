// The Reviews page tabs, shared by the server page (to read ?tab=) and the
// client tabs. Kept free of components so the server can import it.
export const REVIEW_TABS = [
  { id: "bulk", label: "Ministry Assessments" },
  { id: "self", label: "Self Assessments" },
  { id: "demand", label: "Demand Notices" },
  { id: "annual", label: "Annual Notices" },
  { id: "tax", label: "Tax Items" },
] as const;

export type ReviewTab = (typeof REVIEW_TABS)[number]["id"];
