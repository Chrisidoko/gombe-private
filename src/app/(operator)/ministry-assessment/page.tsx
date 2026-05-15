"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Building2,
  ChevronRight,
  X,
  Loader2,
  Send,
  CheckCircle2,
  Settings2,
} from "lucide-react";

type School = {
  school_id: string;
  name: string;
  lga: string;
  state: string;
  email: string;
};

const FEE_OPTIONS = [
  // {
  //   id: "tuition_5pct",
  //   label: "5% of Tuition Fee",
  //   amount: null,
  //   note: "Calculated from student tuition records",
  // },
  {
    id: "annual_renewal",
    label: "Annual License Renewal",
    amount: 150000,
    note: "Flat renewal fee per year",
  },
  {
    id: "penalty_notice",
    label: "Compliance Penalty Notice",
    amount: null,
    note: "Custom amount required",
  },
  // {
  //   id: "inspection_levy",
  //   label: "Inspection Levy",
  //   amount: 50000,
  //   note: "Ministry inspection charge",
  // },
  {
    id: "custom",
    label: "Custom Fee",
    amount: null,
    note: "Enter a custom amount and description",
  },
];

export default function FixedAssessmentsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<School | null>(null);
  const [selectedFee, setSelectedFee] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [narration, setNarration] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced school search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/inspector/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowDropdown(true);
        }
      } catch {
        // silently fail
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  function handleSelect(school: School) {
    setSelected(school);
    setQuery(school.name);
    setShowDropdown(false);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setSelectedFee("");
    setCustomAmount("");
    setCustomDesc("");
    setNarration("");
  }

  const activeFee = FEE_OPTIONS.find((f) => f.id === selectedFee);
  const needsAmount = activeFee && activeFee.amount === null;
  const displayAmount = activeFee?.amount
    ? `₦${activeFee.amount.toLocaleString()}`
    : customAmount
      ? `₦${Number(customAmount).toLocaleString()}`
      : "—";

  // Form is ready when school + fee + amount (if required) are all filled
  const isReady =
    !!selected &&
    !!selectedFee &&
    (!needsAmount || (needsAmount && !!customAmount));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Other Fees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Send flat demand notices to institutions based on ministry
            evaluation results.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="bg-[#1a5c2e] px-6 py-5 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10">
              <Settings2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                New Demand Notice
              </h2>
              <p className="text-xs text-green-300 mt-0.5">
                Kaduna State Ministry of Education
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Step 1 — Select school */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Step 1 — Select Institution
              </label>

              <div ref={wrapperRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (selected) setSelected(null);
                    }}
                    placeholder="Search institution by name..."
                    className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : query ? (
                      <button onClick={handleClear}>
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Dropdown */}
                {showDropdown && !selected && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                    {results.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 text-center">
                        No institutions found
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                        {results.map((school) => (
                          <li key={school.school_id}>
                            <button
                              onClick={() => handleSelect(school)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                            >
                              <Building2 className="w-4 h-4 text-green-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {school.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {school.lga}, {school.state}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Selected school pill */}
              {selected && (
                <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-green-800 truncate">
                      {selected.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {selected.lga}, {selected.state} · {selected.email}
                    </p>
                  </div>
                  <button onClick={handleClear}>
                    <X className="w-4 h-4 text-green-400 hover:text-green-600 transition" />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2 — Select fee */}
            <div
              className={`transition-opacity duration-200 ${!selected ? "opacity-40 pointer-events-none" : ""}`}
            >
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Step 2 — Assign Fee Type
              </label>
              <div className="space-y-2">
                {FEE_OPTIONS.map((fee) => (
                  <label
                    key={fee.id}
                    className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedFee === fee.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fee"
                      value={fee.id}
                      checked={selectedFee === fee.id}
                      onChange={() => {
                        setSelectedFee(fee.id);
                        setCustomAmount("");
                        setCustomDesc("");
                      }}
                      className="w-4 h-4 text-green-600 accent-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {fee.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{fee.note}</p>
                    </div>
                    {fee.amount !== null && (
                      <span className="text-sm font-black text-green-700 shrink-0">
                        ₦{fee.amount.toLocaleString()}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3 — Amount + description (if custom/variable) */}
            {selectedFee && needsAmount && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Step 3 — Enter Amount & Description
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">
                    ₦
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Description (e.g. 2024/2025 tuition levy)"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Narration */}
            {selectedFee && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Narration{" "}
                  <span className="text-gray-300 font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a note for this demand notice..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            )}

            {/* Summary strip */}
            {isReady && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                    Summary
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {activeFee?.label}
                    {customDesc ? ` — ${customDesc}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">{selected?.name}</p>
                </div>
                <p className="text-xl font-black text-green-600">
                  {displayAmount}
                </p>
              </div>
            )}

            {/* Send button — dormant */}
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl text-sm opacity-40 cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send Demand Notice
            </button>
            <p className="text-center text-xs text-gray-400">
              Send functionality coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
