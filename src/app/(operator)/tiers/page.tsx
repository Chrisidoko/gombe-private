"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type School = {
  school_id: string;
  name: string;
  lga: string;
  state: string;
  programmes: string[];
  license_status: string;
  tier: number | null;
};

type TierData = {
  tier1: School[];
  tier2: School[];
  tier3: School[];
  unassigned: School[];
};

const TIER_CONFIG = {
  1: {
    label: "Category A",
    desc: "Small-Scale institutions",
    color: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    header: "bg-blue-600",
    dot: "bg-blue-500",
  },
  2: {
    label: "Category B",
    desc: "Medium-Scale institutions",
    color: "border-green-200 bg-green-50",
    badge: "bg-green-100 text-green-700 border-green-200",
    header: "bg-green-600",
    dot: "bg-green-500",
  },
  3: {
    label: "Category C",
    desc: "Large-Scale institutions",
    color: "border-purple-200 bg-purple-50",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    header: "bg-purple-600",
    dot: "bg-purple-500",
  },
};

function SchoolCard({
  school,
  onMove,
  moving,
}: {
  school: School;
  onMove: (school_id: string, tier: number | null) => void;
  moving: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isMoving = moving === school.school_id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
          <Building2 className="w-4 h-4 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {school.name}
          </p>
          <p className="text-xs text-gray-400">
            {school.lga} · {school.state}
          </p>
        </div>

        {/* Move to tier dropdown toggle */}
        <button
          onClick={() => setOpen(!open)}
          disabled={isMoving}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition shrink-0"
        >
          {isMoving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : open ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          Move
        </button>
      </div>

      {/* Tier selector dropdown */}
      {open && !isMoving && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-wrap gap-2">
          {([1, 2, 3] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                onMove(school.school_id, t);
                setOpen(false);
              }}
              disabled={school.tier === t}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                school.tier === t
                  ? "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
              }`}
            >
              {TIER_CONFIG[t].label}
            </button>
          ))}
          {school.tier && (
            <button
              onClick={() => {
                onMove(school.school_id, null);
                setOpen(false);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-50 transition"
            >
              Unassign
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TierColumn({
  tier,
  schools,
  onMove,
  moving,
}: {
  tier: 1 | 2 | 3;
  schools: School[];
  onMove: (school_id: string, tier: number | null) => void;
  moving: string | null;
}) {
  const config = TIER_CONFIG[tier];

  return (
    <div className={`rounded-2xl border-2 ${config.color} overflow-hidden`}>
      {/* Header */}
      <div className={`${config.header} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white">{config.label}</h3>
            <p className="text-xs text-white/70 mt-0.5">{config.desc}</p>
          </div>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-sm font-black">
            {schools.length}
          </span>
        </div>
      </div>

      {/* School list */}
      <div className="p-3 space-y-2 min-h-[120px]">
        {schools.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-gray-400">
            No schools assigned
          </div>
        ) : (
          schools.map((school) => (
            <SchoolCard
              key={school.school_id}
              school={school}
              onMove={onMove}
              moving={moving}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function TierManagementPage() {
  const [data, setData] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/operator/tiers");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Could not load tier data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  async function handleMove(school_id: string, tier: number | null) {
    setMoving(school_id);
    try {
      const res = await fetch("/api/operator/tiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id, tier }),
      });

      if (!res.ok) throw new Error("Update failed");

      // Update local state optimistically
      setData((prev) => {
        if (!prev) return prev;

        // Find the school across all groups
        const allSchools = [
          ...prev.tier1,
          ...prev.tier2,
          ...prev.tier3,
          ...prev.unassigned,
        ];
        const school = allSchools.find((s) => s.school_id === school_id);
        if (!school) return prev;

        const updated = { ...school, tier };

        const remove = (arr: School[]) =>
          arr.filter((s) => s.school_id !== school_id);

        return {
          tier1:
            tier === 1 ? [...remove(prev.tier1), updated] : remove(prev.tier1),
          tier2:
            tier === 2 ? [...remove(prev.tier2), updated] : remove(prev.tier2),
          tier3:
            tier === 3 ? [...remove(prev.tier3), updated] : remove(prev.tier3),
          unassigned: !tier
            ? [...remove(prev.unassigned), updated]
            : remove(prev.unassigned),
        };
      });

      toast.success(
        tier ? `Moved to Type ${tier}` : "School unassigned from tier",
      );
    } catch {
      toast.error("Failed to update tier");
    } finally {
      setMoving(null);
    }
  }

  // Filter schools by search
  function filterSchools(schools: School[]) {
    if (!search) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.lga?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const unassignedCount = data?.unassigned.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Institution Categorization{" "}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Assign institutions to assessment categories. Changes save
              immediately.
            </p>
          </div>
          <button
            onClick={fetchTiers}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Unassigned warning */}
        {unassignedCount > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              <span className="font-bold">
                {unassignedCount} institution{unassignedCount !== 1 ? "s" : ""}
              </span>{" "}
              not yet assigned to a type — they will be excluded from
              assessments.
            </p>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search institutions across all tiers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Stats row */}
        {data && (
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Type 1",
                count: data.tier1.length,
                color: "text-blue-600",
              },
              {
                label: "Type 2",
                count: data.tier2.length,
                color: "text-green-600",
              },
              {
                label: "Type 3",
                count: data.tier3.length,
                color: "text-purple-600",
              },
              {
                label: "Unassigned",
                count: data.unassigned.length,
                color: "text-gray-400",
              },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 text-center"
              >
                <p className={`text-xl font-black ${color}`}>{count}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Three tier columns */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {([1, 2, 3] as const).map((tier) => (
              <TierColumn
                key={tier}
                tier={tier}
                schools={filterSchools(
                  tier === 1
                    ? data.tier1
                    : tier === 2
                      ? data.tier2
                      : data.tier3,
                )}
                onMove={handleMove}
                moving={moving}
              />
            ))}
          </div>
        )}

        {/* Unassigned pool */}
        {data && data.unassigned.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-700">
                  Unassigned Institutions
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  These schools have not been placed in any tier yet
                </p>
              </div>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 text-xs font-black">
                {filterSchools(data.unassigned).length}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filterSchools(data.unassigned).map((school) => (
                <SchoolCard
                  key={school.school_id}
                  school={school}
                  onMove={handleMove}
                  moving={moving}
                />
              ))}
            </div>
          </div>
        )}

        {/* All assigned confirmation */}
        {data && data.unassigned.length === 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              All institutions have been assigned to a tier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
