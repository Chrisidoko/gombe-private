"use client";

import { useEffect, useState } from "react";

import { Divider } from "@/components/Divider";
import { PackageOpen } from "lucide-react";
import { formatDate } from "@/lib/formatDate";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export interface Assessment {
  id: number;
  school_id: string;
  total_revenue: string;
  commission_amount: string;
  created_at: string;
  school_name: string;
  school_email: string;
  reason: string;
}

export default function Requests() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [aloading, aSetLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({
    id: null,
    action: null,
  }); // loader strictly for assement

  useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch("/api/assessment/pending");
        const data = await res.json();
        setAssessments(data.assessments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPending();
  }, []);
  async function handleAction(
    assessment_id: number,
    school_id: string,
    amount: string,
    action: "approve" | "reject",
    reason: string // lowercase
  ) {
    aSetLoading({ id: assessment_id, action });

    try {
      const endpoint =
        action === "approve"
          ? "/api/assessment/approve"
          : "/api/assessment/reject";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id, school_id, amount, reason }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} assessment`);

      toast.success(
        action === "approve"
          ? "Invoice generated and email sent successfully!"
          : "Assessment rejected successfully!"
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Operation failed. Please try again.");
    } finally {
      aSetLoading({ id: null, action: null });
    }
  }

  if (loading)
    return (
      <div className="flex items-center gap-2">
        {" "}
        <Loader2 className="w-5 h-5 animate-spin" /> <p>Loading assessments</p>
      </div>
    );

  return (
    <main>
      <div className="flex flex-col gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Assessments</h1>
          <p className="text-gray-500 sm:text-sm/6">
            Manage aprrovals & Institutions
          </p>
        </div>

        <div className="w-full py-6">
          {assessments.length === 0 ? (
            <div className="flex items-center justify-center  gap-4 mx-auto text-gray-500">
              <PackageOpen />
              <p>No pending assessments.</p>
            </div>
          ) : (
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-sm uppercase text-left">
                  <th className="p-2">School</th>
                  <th className="p-2">Revenue</th>
                  <th className="p-2">5% Due</th>
                  <th className="p-2">Filing Date</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-t text-gray-500">
                    <td className="p-2">{a.school_name}</td>
                    <td className="p-2">
                      ₦{Number(a.total_revenue).toLocaleString()}
                    </td>
                    <td className="p-2">
                      ₦{Number(a.commission_amount).toLocaleString()}
                    </td>
                    <td className="p-2">{formatDate(a.created_at)}</td>
                    <td className="p-2 flex gap-2">
                      {/* Approve Button */}
                      <button
                        disabled={
                          aloading.id === a.id && aloading.action === "approve"
                        }
                        onClick={() =>
                          handleAction(
                            a.id,
                            a.school_id,
                            a.commission_amount,
                            "approve",
                            "" // no reason for approval at this time
                          )
                        }
                        className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-md flex items-center gap-2 cursor-pointer"
                      >
                        {aloading.id === a.id &&
                        aloading.action === "approve" ? (
                          <div className="flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Approve</span>
                          </div>
                        ) : (
                          "Approve"
                        )}
                      </button>

                      {/* Reject Button */}
                      <button
                        disabled={
                          aloading.id === a.id && aloading.action === "reject"
                        }
                        onClick={() => {
                          const reason =
                            prompt("Enter reason for rejection (optional):") ||
                            "";
                          handleAction(
                            a.id,
                            a.school_id,
                            a.commission_amount,
                            "reject",
                            reason
                          );
                        }}
                        className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-md flex items-center gap-2 cursor-pointer"
                      >
                        {aloading.id === a.id &&
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
