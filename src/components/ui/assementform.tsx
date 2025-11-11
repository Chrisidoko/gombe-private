"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import toast from "react-hot-toast";

export default function AssesmentForm() {
  const [formData, setFormData] = useState({
    population_100: 0,
    population_200: 0,
    population_300: 0,
    population_400: 0,
    population_500: 0,
    population_postgrad: 0,
    fee_100: 0,
    fee_200: 0,
    fee_300: 0,
    fee_400: 0,
    fee_500: 0,
    fee_postgrad: 0,
    session: "",
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Assessment submitted successfully!");
      } else {
        toast.error(data.message || "Failed to submit assessment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 text-sm max-w-5xl w-full sm:w-2/3"
    >
      {/* Population by Level */}
      <div>
        <label className="text-sm font-medium">Population by level</label>
        <div className=" mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          {["100", "200", "300", "400", "500", "postgrad"].map((level) => (
            <input
              key={level}
              type="**numeric**"
              pattern="[0-9]*"
              placeholder={`${level} Level`}
              onChange={(e) =>
                handleChange(`population_${level}`, Number(e.target.value))
              }
              className="p-2 border rounded"
            />
          ))}
        </div>
      </div>

      {/* Average Fee by Level */}
      <div>
        <label className="text-sm font-medium">Average Fee by Level</label>
        <div className=" mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          {["100", "200", "300", "400", "500", "postgrad"].map((level) => (
            <input
              key={level}
              type="**numeric**"
              pattern="[0-9]*"
              placeholder={`${level} Level Fee`}
              onChange={(e) =>
                handleChange(`fee_${level}`, Number(e.target.value))
              }
              className="p-2 border rounded"
            />
          ))}
        </div>
      </div>

      {/* Academic Session */}
      <div>
        <label className="text-sm font-medium">Next Academic Session</label>
        <select
          onChange={(e) => handleChange("session", e.target.value)}
          className="p-2 mt-2 border rounded bg-white w-full"
        >
          <option value="">Select Session</option>
          {Array.from({ length: 3 }).map((_, i) => {
            const currentYear = new Date().getFullYear();
            const startYear = currentYear + 1 - i;
            const endYear = startYear + 1;
            const session = `${startYear}/${endYear}`;
            return (
              <option key={session} value={session}>
                {session}
              </option>
            );
          })}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="date"
          onChange={(e) => handleChange("start_date", e.target.value)}
          className="p-2 border rounded"
          placeholder="Session Start Date"
        />
        <input
          type="date"
          onChange={(e) => handleChange("end_date", e.target.value)}
          className="p-2 border rounded"
          placeholder="Expected End Date"
        />
      </div>

      {/* Submit */}
      <button
        disabled={loading}
        className={`mt-12 w-full px-6 py-2 flex items-center justify-center gap-2 rounded bg-[#28a745] text-white font-semibold transition ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#218838]"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Submit</span>
          </>
        ) : (
          "Submit"
        )}
      </button>
    </form>
  );
}
