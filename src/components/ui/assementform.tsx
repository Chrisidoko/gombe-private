"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import toast from "react-hot-toast";

export default function AssesmentForm() {
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    // You can add validation here if needed
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

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
    <div className="space-y-6 text-sm max-w-5xl w-full sm:w-2/3">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
              step === 1
                ? "bg-yellow-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            1
          </div>
          <div
            className={`h-1 w-16 transition-all duration-300 ${
              step === 2 ? "bg-yellow-500" : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
              step === 2
                ? "bg-yellow-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
        </div>
      </div>

      {/* Step Labels */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {step === 1
            ? "Step 1: Population & Fees"
            : "Step 2: Academic Session"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1
            ? "Enter student population and fees by level"
            : "Set the academic session details"}
        </p>
      </div>

      {/* Step 1: Population & Fees */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Population by Level */}
          <div>
            <label className="text-sm font-medium">Population by level</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {["100", "200", "300", "400", "500", "postgrad"].map((level) => (
                <input
                  key={level}
                  type="**numeric**"
                  pattern="[0-9]*"
                  placeholder={`${level} Level`}
                  onChange={(e) =>
                    handleChange(`population_${level}`, Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              ))}
            </div>
          </div>

          {/* Average Fee by Level */}
          <div>
            <label className="text-sm font-medium">Average Fee by Level</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {["100", "200", "300", "400", "500", "postgrad"].map((level) => (
                <input
                  key={level}
                  type="**numeric**"
                  pattern="[0-9]*"
                  placeholder={`${level} Level Fee`}
                  onChange={(e) =>
                    handleChange(`fee_${level}`, Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full px-6 py-3 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-300"
          >
            Next: Academic Session →
          </button>
        </div>
      )}

      {/* Step 2: Academic Session */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Academic Session */}
          <div>
            <label className="text-sm font-medium">Next Academic Session</label>
            <select
              onChange={(e) => handleChange("session", e.target.value)}
              className="p-2 mt-2 border border-gray-300 rounded bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            <div>
              <label className="text-sm font-medium block mb-2">
                Session Start Date
              </label>
              <input
                type="date"
                onChange={(e) => handleChange("start_date", e.target.value)}
                className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                Expected End Date
              </label>
              <input
                type="date"
                onChange={(e) => handleChange("end_date", e.target.value)}
                className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-1/3 px-6 py-3 rounded border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`w-2/3 px-6 py-3 flex items-center justify-center gap-2 rounded bg-[#28a745] text-white font-semibold transition-all duration-300 ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#218838]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
