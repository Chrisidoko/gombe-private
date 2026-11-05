"use client";

// A school's compliance score: the onboarding steps before approval, and
// this year's obligations after. `wide` lays the ring beside the breakdown,
// for the school's overview page; the inspector's narrow column stacks them.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import type { ActionItem, ComplianceStatus, ScoreItem } from "@/lib/compliance";

type ComplianceData = ComplianceStatus & { nextAction: ActionItem | null };

const naira = (n: number) => `₦${n.toLocaleString()}`;

function ScoreList({ items }: { items: ScoreItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((m) => (
        <div key={m.label} className="flex items-center gap-3">
          {m.completed ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-gray-300 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm truncate ${m.completed ? "text-gray-800" : "text-gray-500"}`}
            >
              {m.label}
            </p>
            <p className="text-[11px] text-gray-400">{m.detail}</p>
          </div>
          <span
            className={`text-xs font-bold shrink-0 ${
              m.earned === m.points
                ? "text-green-600"
                : m.earned > 0
                  ? "text-amber-600"
                  : "text-gray-300"
            }`}
          >
            {m.earned}/{m.points}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ComplyCard({
  school_id,
  wide = false,
  showNextStep = false,
}: {
  school_id: string;
  wide?: boolean;
  // Only the school itself can act on the next step
  showNextStep?: boolean;
}) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCompliance() {
      try {
        const res = await fetch(
          `/api/schools/fees/status?school_id=${encodeURIComponent(school_id)}`,
        );
        if (!res.ok) throw new Error("Failed to fetch compliance data");
        setData(await res.json());
      } catch {
        setError("Could not load compliance data.");
      } finally {
        setLoading(false);
      }
    }
    fetchCompliance();
  }, [school_id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error || "No compliance data."}</p>
      </div>
    );
  }

  const score = data.complianceScore;
  const isAnnual = data.phase === "annual";
  const applicationFormUnpaid = !isAnnual && !data.onboarding[0]?.completed;
  const ringColor =
    score === 0
      ? "#e5e7eb"
      : score >= 80
        ? "#10b981"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";
  const next = showNextStep ? data.nextAction : null;

  return (
    <div className="relative h-full">
      {/* Before anything is paid, the score has nothing to show yet */}
      {applicationFormUnpaid && (
        <div className="absolute inset-0 z-10 rounded-xl bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center border border-red-200">
          <div className="mx-4 bg-white border border-red-200 rounded-xl shadow-md px-5 py-4 text-center max-w-xs">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm font-bold text-red-700 mb-1">
              Application Form Unpaid
            </p>
            {showNextStep && (
              <Link
                href="/fees"
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Go to Fees
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Score</h3>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {isAnnual ? new Date().getFullYear() : "Onboarding"}
          </span>
        </div>

        <div
          className={
            wide
              ? "grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center flex-1"
              : "flex-1"
          }
        >
          {/* Ring */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={ringColor}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score}%</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                  compliance
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className={wide ? "space-y-4" : "mt-4 space-y-4"}>
            {isAnnual ? (
              <>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500">Onboarding</span>
                  <span
                    className={`text-xs font-semibold ${data.onboardingComplete ? "text-green-600" : "text-amber-600"}`}
                  >
                    {data.onboardingComplete
                      ? "Complete"
                      : `${data.onboarding.filter((s) => s.completed).length} of ${data.onboarding.length} done`}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    This year
                  </p>
                  <ScoreList items={data.annual} />
                </div>
              </>
            ) : (
              <ScoreList items={data.onboarding} />
            )}
          </div>
        </div>

        {next && (
          <Link
            href={next.href}
            className={`mt-5 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
              next.overdue
                ? "border-red-200 bg-red-50 hover:bg-red-100"
                : "border-green-200 bg-green-50 hover:bg-green-100"
            }`}
          >
            <div className="min-w-0">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wide ${next.overdue ? "text-red-600" : "text-green-700"}`}
              >
                Next step{next.overdue ? " · overdue" : ""}
              </p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {next.label}
                {next.amount !== null ? ` · ${naira(next.amount)}` : ""}
              </p>
            </div>
            <ArrowRight
              className={`w-4 h-4 shrink-0 ${next.overdue ? "text-red-600" : "text-green-700"}`}
            />
          </Link>
        )}
      </div>
    </div>
  );
}
