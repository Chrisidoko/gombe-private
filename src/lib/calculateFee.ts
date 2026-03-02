// lib/calculateFee.ts

const PROGRAMME_TIERS: Record<string, number> = {
  "National Diploma / NCE": 1,
  "Professional Certifications": 1,
  "Higher National Diploma (HND)": 2,
  "Bachelor's Degree": 2,
  "Postgraduate Diploma (PGD)": 2,
  "Master's Degree": 3,
  "Doctorate Degree (Ph.D.)": 3,
};

const TIER_FEES: Record<
  number,
  { amount: number; label: string; category: string }
> = {
  1: {
    amount: 300000,
    label: "₦300,000",
    category: "Category 1: NCE / ND Institutions",
  },
  2: {
    amount: 350000,
    label: "₦350,000",
    category: "Category 2: HND / BSc Institutions",
  },
  3: {
    amount: 1000000,
    label: "₦1,000,000",
    category: "Category 3: Masters / PhD Institutions",
  },
};

export function calculateFee(programmes: string[]): {
  amount: number;
  label: string;
  category: string;
  tier: number;
} {
  if (!programmes || programmes.length === 0) {
    return { ...TIER_FEES[1], tier: 1 }; // default to lowest tier
  }

  // Find the highest tier among all the school's programmes
  const highestTier = programmes.reduce((max, programme) => {
    const tier = PROGRAMME_TIERS[programme.trim()] ?? 1;
    return Math.max(max, tier);
  }, 1);

  return { ...TIER_FEES[highestTier], tier: highestTier };
}
