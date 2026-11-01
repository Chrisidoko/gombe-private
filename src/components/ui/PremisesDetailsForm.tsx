"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PremisesDetailsForm({
  schoolId,
  locationType,
  premisesCategory,
}: {
  schoolId: string;
  locationType: string | null;
  premisesCategory: string | null;
}) {
  const [location, setLocation] = useState(locationType ?? "");
  const [premises, setPremises] = useState(premisesCategory ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/schools/${encodeURIComponent(schoolId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_type: location,
            premises_category: premises,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Premises details saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save details",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          Location
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select location</option>
          <option value="urban">Urban</option>
          <option value="rural">Rural</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          Premises category
        </label>
        <select
          value={premises}
          onChange={(e) => setPremises(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select category</option>
          <option value="A">Category A</option>
          <option value="B">Category B</option>
          <option value="C">Category C</option>
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !location || !premises}
        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save
      </button>
    </div>
  );
}
