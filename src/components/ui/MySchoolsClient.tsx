"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type School = {
  school_id: string;
  name: string;
  email: string;
  form_status: string | null;
  approval_status: string | null;
  created_at: string;
};

type Step = {
  label: string;
  description: string;
  done: boolean;
  active: boolean;
};

function getSteps(school: School): Step[] {
  const profileComplete = school.form_status === "complete";
  const approved = school.approval_status === "approved";

  return [
    {
      label: "Created",
      description: "School account registered in system",
      done: true,
      active: !profileComplete,
    },
    {
      label: "Profile Complete",
      description: "School has filled and submitted their profile",
      done: profileComplete,
      active: profileComplete && !approved,
    },
    {
      label: "Approved",
      description: "Ministry has reviewed and approved the school",
      done: approved,
      active: approved,
    },
  ];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusPipeline({ school }: { school: School }) {
  const steps = getSteps(school);

  return (
    <div className="flex items-start gap-0 mt-4">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Icon */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                    step.done
                      ? "border-green-600 bg-green-600"
                      : step.active
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : step.active ? (
                    <Clock className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                {/* Label */}
                <p
                  className={`text-xs font-semibold mt-1 text-center whitespace-nowrap ${
                    step.done
                      ? "text-green-700"
                      : step.active
                        ? "text-green-500"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-gray-400 text-center mt-0.5 leading-tight max-w-[80px]">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 flex items-center mt-4">
                <div
                  className={`h-0.5 w-full transition-all ${
                    steps[i + 1].done || steps[i].done
                      ? "bg-green-400"
                      : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getOverallBadge(school: School) {
  if (school.approval_status === "approved") {
    return { label: "Approved", cls: "bg-green-100 text-green-700 border-green-200" };
  }
  if (school.form_status === "complete") {
    return { label: "Pending Review", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: "Awaiting Profile", cls: "bg-amber-50 text-amber-700 border-amber-200" };
}

export default function MySchoolsClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/inspector/my-schools");
        if (res.ok) setSchools(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schools</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Institutions you registered — track their profile and approval progress.
          </p>
        </div>

        {/* Summary chips */}
        {schools.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              <Building2 className="w-3.5 h-3.5" />
              {schools.length} school{schools.length !== 1 ? "s" : ""} created
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {schools.filter((s) => s.approval_status === "approved").length} approved
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Clock className="w-3.5 h-3.5" />
              {schools.filter((s) => s.form_status === "complete" && s.approval_status !== "approved").length} pending review
            </span>
          </div>
        )}

        {/* School list */}
        {schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 text-center">
            <Building2 className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No schools yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Schools you create will appear here with their progress.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {schools.map((school) => {
              const badge = getOverallBadge(school);
              const isExpanded = expandedId === school.school_id;

              return (
                <li
                  key={school.school_id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Card header — always visible */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : school.school_id)
                    }
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-50 border border-green-100 shrink-0">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {school.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {school.school_id} · Created {formatDate(school.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badge.cls}`}
                    >
                      {badge.label}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded detail — progress pipeline */}
                  {isExpanded && (
                    <div className="px-5 pb-6 border-t border-gray-100">
                      <StatusPipeline school={school} />

                      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Email</p>
                          <p className="text-gray-700 mt-0.5 truncate">{school.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Profile Status</p>
                          <p className={`mt-0.5 font-semibold ${school.form_status === "complete" ? "text-green-600" : "text-amber-500"}`}>
                            {school.form_status === "complete" ? "Complete" : "Incomplete"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Approval</p>
                          <p className={`mt-0.5 font-semibold ${
                            school.approval_status === "approved"
                              ? "text-green-600"
                              : school.approval_status === "rejected"
                                ? "text-red-500"
                                : "text-gray-500"
                          }`}>
                            {school.approval_status === "approved"
                              ? "Approved"
                              : school.approval_status === "rejected"
                                ? "Rejected"
                                : "Pending"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Created</p>
                          <p className="text-gray-700 mt-0.5">{formatDate(school.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
