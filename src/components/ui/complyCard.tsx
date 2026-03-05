"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

type Milestone = {
  label: string;
  detail: string;
  completed: boolean;
  score: number;
};

type ComplianceData = {
  complianceScore: number;
  consentLetterPaid: boolean;
  guidelinesPaid: boolean;
  applicationPaid: boolean;
  assessmentComplete: boolean;
  questionnaireUploaded: boolean;
  adminApproved: boolean;
  certificatePaid: boolean;
  milestones: Milestone[];
  totalFees: number;
  paidFees: number;
  unpaidFees: number;
};

export default function ComplyCard({ school_id }: { school_id: string }) {
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
        const json = await res.json();
        setData(json);
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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const score = data?.complianceScore ?? 0;
  const consentUnpaid = !data?.consentLetterPaid;
  const milestones = data?.milestones ?? [];

  const ringColor =
    score === 0
      ? "#e5e7eb"
      : score >= 80
        ? "#10b981"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="relative">
      {/* ── Red overlay — consent letter unpaid ────────────────────────── */}
      {consentUnpaid && (
        <div className="absolute inset-0 z-10 rounded-xl bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center border border-red-200">
          <div className="mx-4 bg-white border border-red-200 rounded-xl shadow-md px-5 py-4 text-center max-w-xs">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm font-bold text-red-700 mb-1">
              Establishment Fee Unpaid
            </p>
            {/* <p className="text-xs text-red-500 leading-relaxed">
              Please visit the Consent Letter fee payment page to
              activate your compliance standing.
            </p> */}
          </div>
        </div>
      )}

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Compliance Score
        </h3>

        {/* Circular progress */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
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

        {/* Milestone list */}
        <div className="mt-4 space-y-2.5">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              {m.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-base truncate ${m.completed ? "text-gray-800" : "text-gray-400"}`}
                >
                  {m.label}
                </p>
                <p className="text-[10px] text-gray-400">{m.detail}</p>
              </div>
              <span
                className={`text-[10px] font-bold shrink-0 ${m.completed ? "text-green-600" : "text-gray-300"}`}
              >
                {m.score}%
              </span>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>
            {data?.paidFees ?? 0} of {data?.totalFees ?? 0} fees paid
          </span>
          <span className="font-semibold text-gray-500">
            {data?.unpaidFees ?? 0} outstanding
          </span>
        </div>
      </div>
    </div>
  );
}
