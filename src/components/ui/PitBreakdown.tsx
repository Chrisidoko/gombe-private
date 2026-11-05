// How a declared income maps onto the Personal Income Tax bands, for the
// operators reviewing it.
import { assessPit } from "@/lib/pitBands";

const naira = (v: number) => `₦${v.toLocaleString()}`;
const percent = (r: number) => `${Math.round(r * 10000) / 100}%`;

function bandLabel(from: number, upTo: number | null) {
  if (from === 0) return `First ${naira(upTo as number)}`;
  if (upTo === null) return `Above ${naira(from)}`;
  return `${naira(from + 1)} – ${naira(upTo)}`;
}

export default function PitBreakdown({
  income,
  year,
}: {
  income: number;
  year: number;
}) {
  const pit = assessPit(income, year);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-500">Declared total income</span>
        <span className="font-bold text-gray-900">{naira(pit.income)}</span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-400">
            <th className="pb-1 font-medium">Band</th>
            <th className="pb-1 font-medium text-right">Rate</th>
            <th className="pb-1 font-medium text-right">Taxed</th>
            <th className="pb-1 font-medium text-right">Tax</th>
          </tr>
        </thead>
        <tbody>
          {pit.slices.map((s) => (
            <tr
              key={s.from}
              className={s.taxable > 0 ? "text-gray-700" : "text-gray-300"}
            >
              <td className="py-0.5">{bandLabel(s.from, s.upTo)}</td>
              <td className="py-0.5 text-right">{percent(s.rate)}</td>
              <td className="py-0.5 text-right">{naira(s.taxable)}</td>
              <td className="py-0.5 text-right">{naira(s.tax)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3 text-sm">
        <span className="text-gray-500">
          Recommended tax · top band {percent(pit.topRate)}, effective{" "}
          {percent(pit.effectiveRate)}
        </span>
        <span className="font-black text-green-700">{naira(pit.tax)}</span>
      </div>
    </div>
  );
}
