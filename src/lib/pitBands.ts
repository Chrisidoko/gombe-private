// Personal Income Tax bands under the Nigeria Tax Act, in force from 2026.
// A school declares its total income for the year; the platform works out the
// tax from these bands and Operator 1 and 2 approve it.
//
// If the bands change, add a new set with the year it starts from. A notice
// year uses the newest set that has started by then.
export type PitBand = { upTo: number | null; rate: number };

const PIT_BAND_SETS: { from: number; bands: PitBand[] }[] = [
  {
    from: 2026,
    bands: [
      { upTo: 800_000, rate: 0 },
      { upTo: 3_000_000, rate: 0.15 },
      { upTo: 12_000_000, rate: 0.18 },
      { upTo: 25_000_000, rate: 0.21 },
      { upTo: 50_000_000, rate: 0.23 },
      { upTo: null, rate: 0.25 },
    ],
  },
];

export const PIT_SUBHEAD_CODE = "GIRS_PIT";

export type PitSlice = {
  from: number;
  upTo: number | null;
  rate: number;
  taxable: number;
  tax: number;
};

export type PitAssessment = {
  income: number;
  tax: number;
  topRate: number;
  effectiveRate: number;
  slices: PitSlice[];
};

function bandsFor(year: number) {
  const set =
    [...PIT_BAND_SETS].reverse().find((s) => s.from <= year) ?? PIT_BAND_SETS[0];
  return set.bands;
}

export function assessPit(income: number, year: number): PitAssessment {
  const slices: PitSlice[] = [];
  let lower = 0;
  let tax = 0;
  let topRate = 0;

  for (const band of bandsFor(year)) {
    const upper = band.upTo ?? Infinity;
    const taxable = Math.max(0, Math.min(income, upper) - lower);
    const sliceTax = Math.round(taxable * band.rate);
    slices.push({ from: lower, upTo: band.upTo, rate: band.rate, taxable, tax: sliceTax });
    if (taxable > 0) topRate = band.rate;
    tax += sliceTax;
    lower = upper;
  }

  return {
    income,
    tax,
    topRate,
    effectiveRate: income > 0 ? tax / income : 0,
    slices,
  };
}
