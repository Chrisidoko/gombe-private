"use client";

// The staff rows behind a PAYE return. Operators also see the PAYE the bands
// give on each salary, to compare with what the school deducted.
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { StaffGroup } from "@/lib/payeShared";

type SavedStaffRow = {
  staff_name: string;
  staff_group: StaffGroup;
  role: string | null;
  gross_pay: string;
  paye_deducted: string;
  expected_paye: string;
};

const GROUP_LABELS: Record<StaffGroup, string> = {
  academic: "Academic",
  non_academic: "Non-academic",
};

const naira = (v: string | number) => `₦${Number(v).toLocaleString()}`;

export default function PayeStaffTable({
  returnId,
  showExpected = false,
}: {
  returnId: number;
  showExpected?: boolean;
}) {
  const [staff, setStaff] = useState<SavedStaffRow[] | null>(null);

  useEffect(() => {
    fetch(`/api/paye-returns/${returnId}/staff`)
      .then((r) => (r.ok ? r.json() : { staff: [] }))
      .then((d) => setStaff(d.staff));
  }, [returnId]);

  if (!staff) {
    return <Loader2 className="w-4 h-4 animate-spin text-gray-300 mx-auto my-3" />;
  }
  if (staff.length === 0) {
    return <p className="text-xs text-gray-400 py-3">No staff rows on this return.</p>;
  }
  return (
    <div className="overflow-x-auto max-h-80">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-400">
            <th className="py-1.5 font-medium">Name</th>
            <th className="py-1.5 font-medium">Group</th>
            <th className="py-1.5 font-medium">Role</th>
            <th className="py-1.5 font-medium text-right">Gross pay</th>
            <th className="py-1.5 font-medium text-right">PAYE deducted</th>
            {showExpected && (
              <th className="py-1.5 font-medium text-right">Expected PAYE</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staff.map((s, i) => {
            const short = Number(s.paye_deducted) < Number(s.expected_paye);
            return (
              <tr key={i} className="text-gray-700">
                <td className="py-1.5">{s.staff_name}</td>
                <td className="py-1.5">{GROUP_LABELS[s.staff_group]}</td>
                <td className="py-1.5">{s.role}</td>
                <td className="py-1.5 text-right">{naira(s.gross_pay)}</td>
                <td
                  className={`py-1.5 text-right ${showExpected && short ? "text-red-600 font-semibold" : ""}`}
                >
                  {naira(s.paye_deducted)}
                </td>
                {showExpected && (
                  <td className="py-1.5 text-right">{naira(s.expected_paye)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
