"use client";

import { useEffect, useState } from "react";
import { Divider } from "@/components/Divider";
import { PackageOpen, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface School {
  id: number;
  school_id: string;
  name: string;
  email: string;
  license_number: string;
  created_at: string;
}

export default function Requests() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [aloading, aSetLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({
    id: null,
    action: null,
  }); // loader strictly for school approvals

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch("/api/schools/unapproved");
        const data = await res.json();
        setSchools(data.schools || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load schools.");
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> <p>Loading schools...</p>
      </div>
    );

  async function handleAction(
    request_id: number,
    school_id: string,
    action: "approve" | "reject",
    reason?: string
  ) {
    aSetLoading({ id: request_id, action });
    try {
      const endpoint =
        action === "approve" ? "/api/schools/approve" : "/api/schools/reject";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id, reason }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(result.message);

      // refresh list after action
      setSchools((prev) => prev.filter((s) => s.school_id !== school_id));
    } catch (error) {
      toast.error("Action failed");
      console.error(error);
    } finally {
      aSetLoading({ id: null, action: null });
    }
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            School Onboarding & Registrations
          </h1>
          <p className="text-gray-500 sm:text-sm/6">
            Manage onboarding approvals for institutions
          </p>
        </div>

        <div className="w-full py-6">
          {schools.length === 0 ? (
            <div className="flex items-center justify-center gap-4 text-gray-500">
              <PackageOpen />
              <p>No unapproved schools available.</p>
            </div>
          ) : (
            <table className="w-full border divide-y rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">School</th>
                  <th className="p-2 text-left">School ID</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">State License No.</th>
                  <th className="p-2 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.school_id}</td>
                    <td className="p-2">{s.email ?? "—"}</td>
                    <td className="p-2">{s.license_number}</td>
                    <td className="p-2">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button
                        disabled={
                          aloading.id === s.id && aloading.action === "approve"
                        }
                        onClick={() =>
                          handleAction(s.id, s.school_id, "approve")
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        {aloading.id === s.id &&
                        aloading.action === "approve" ? (
                          <div className="flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Approve</span>
                          </div>
                        ) : (
                          "Approve"
                        )}
                      </button>
                      <button
                        disabled={
                          aloading.id === s.id && aloading.action === "reject"
                        }
                        onClick={() => {
                          const reason =
                            prompt("Enter reason for rejection (optional):") ||
                            "";
                          handleAction(s.id, s.school_id, "reject", reason);
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        {aloading.id === s.id &&
                        aloading.action === "reject" ? (
                          <div className="flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Reject</span>
                          </div>
                        ) : (
                          "Reject"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Divider />
    </main>
  );
}
