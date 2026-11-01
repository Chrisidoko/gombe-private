// lib/feeDefinitions.ts
// The Ministry's Compliance Standing fees. See api/schools/fees/route.ts for how
// stages and annual cycles apply.
export type FeeTier = "university" | "hnd";

type FeeDefinition = {
  id: number;
  name: string;
  description: string;
  group: string;
  stage: number;
  mandatory: boolean;
  recurring: boolean;
  amounts: Record<FeeTier, number>;
};

export const FEE_DEFINITIONS: FeeDefinition[] = [
  // Stage 1 — Application Fees
  {
    id: 1,
    name: "Application Form",
    description: "One-time application form fee for institution registration.",
    group: "Application Fees",
    stage: 1,
    mandatory: true,
    recurring: false,
    amounts: { university: 50000, hnd: 50000 },
  },
  {
    id: 2,
    name: "Guideline Booklet",
    description: "Covers the cost of the issued guideline booklet.",
    group: "Application Fees",
    stage: 1,
    mandatory: true,
    recurring: false,
    amounts: { university: 60000, hnd: 60000 },
  },

  // Stage 2 — Registration
  {
    id: 3,
    name: "Registration",
    description: "One-time institution registration fee.",
    group: "Registration",
    stage: 2,
    mandatory: true,
    recurring: false,
    amounts: { university: 300000, hnd: 200000 },
  },

  // Stage 3 — Certificate Fee (locked until assessment approved)
  {
    id: 4,
    name: "Issuing of Certificate",
    description:
      "Ministry's issuance of the institution's certificate of registration.",
    group: "Certificate Fee",
    stage: 3,
    mandatory: true,
    recurring: false,
    amounts: { university: 40000, hnd: 40000 },
  },

  // Recurs every year, only visible once Registration is paid — same bracket as Registration
  {
    id: 5,
    name: "Monitoring, Supervision and Evaluation",
    description: "Annual monitoring, supervision and evaluation fee.",
    group: "Registration",
    stage: 2,
    mandatory: true,
    recurring: true,
    amounts: { university: 60000, hnd: 60000 },
  },
  // Recurs annually, but only becomes due one year after Registration — omitted until then
  {
    id: 6,
    name: "Annual Renewal of Registration",
    description: "Annual renewal of the institution's registration.",
    group: "Registration",
    stage: 2,
    mandatory: true,
    recurring: true,
    amounts: { university: 150000, hnd: 100000 },
  },
];

export function resolveTier(category: string | null): FeeTier {
  return category === "University" ? "university" : "hnd";
}
