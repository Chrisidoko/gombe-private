"use client";

import { useEffect, useState } from "react";
import {
  PackageOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  Calculator,
  FileText,
  Check,
  X,
  LockKeyhole,
  LockKeyholeOpen,
} from "lucide-react";
import toast from "react-hot-toast";

export interface Assessment {
  id: number;
  school_id: string;
  total_revenue: string;
  commission_amount: string;
  created_at: string;
  school_name: string;
  school_email: string;
  reason?: string;
  // Population and fee data
  population_100?: number;
  fee_100?: number;
  population_200?: number;
  fee_200?: number;
  population_300?: number;
  fee_300?: number;
  population_400?: number;
  fee_400?: number;
  population_500?: number;
  fee_500?: number;
  population_postgrad?: number;
  fee_postgrad?: number;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AssessmentCard({
  assessment,
  onApprove,
  onReject,
  loading,
}: {
  assessment: Assessment;
  onApprove: () => void;
  onReject: (reason: string) => void;
  loading: { id: number | null; action: string | null };
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const categories = [
    {
      label: "Level 100",
      population: assessment.population_100,
      fee: assessment.fee_100,
    },
    {
      label: "Level 200",
      population: assessment.population_200,
      fee: assessment.fee_200,
    },
    {
      label: "Level 300",
      population: assessment.population_300,
      fee: assessment.fee_300,
    },
    {
      label: "Level 400",
      population: assessment.population_400,
      fee: assessment.fee_400,
    },
    {
      label: "Level 500",
      population: assessment.population_500,
      fee: assessment.fee_500,
    },
    {
      label: "Postgraduate",
      population: assessment.population_postgrad,
      fee: assessment.fee_postgrad,
    },
  ].filter((cat) => cat.population && cat.fee);

  const totalStudents = categories.reduce(
    (sum, cat) => sum + (cat.population || 0),
    0,
  );
  const isLoading = loading.id === assessment.id;

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    onReject(rejectionReason);
    setShowRejectModal(false);
    setRejectionReason("");
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  return (
    <>
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <X className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Reject Assessment
                  </h3>
                  <p className="text-red-100 text-sm">
                    Provide a reason for rejection
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="rejection-reason"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Reason for Rejection
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason why this assessment is being rejected..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                  rows={4}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  This reason will be sent to {assessment.school_name}
                </p>
              </div>

              {/* School Info */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 mb-1">
                  Rejecting assessment for:
                </p>
                <p className="font-semibold text-gray-900">
                  {assessment.school_name}
                </p>
                <p className="text-sm text-gray-600">
                  {assessment.school_email}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRejectCancel}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && loading.action === "reject" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {assessment.school_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {assessment.school_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                <span className="px-2 py-1 bg-white rounded border border-gray-200">
                  ID: {assessment.school_id}
                </span>
                <span className="px-2 py-1 bg-white rounded border border-gray-200">
                  Filed: {formatDate(assessment.created_at)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-4 p-2 hover:bg-white rounded-lg transition-colors"
              title={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white"> ₦ </span>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Total Revenue
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₦{Number(assessment.total_revenue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  5% Commission Due
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₦{Number(assessment.commission_amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Total Students
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {totalStudents}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Breakdown */}
        {expanded && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Revenue Breakdown by Student Level
              </h4>

              <div className="space-y-3">
                {categories.map((cat, idx) => {
                  const revenue = (cat.population || 0) * (cat.fee || 0);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {cat.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Number(cat.population).toLocaleString()} students × ₦
                            {Number(cat.fee).toLocaleString()} per student
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₦{revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 text-white mt-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    <span className="font-semibold">
                      Total Revenue Calculated
                    </span>
                  </div>
                  <span className="text-lg font-bold">
                    ₦{Number(assessment.total_revenue).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            disabled={isLoading}
            onClick={onApprove}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold px-4 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {isLoading && loading.action === "approve" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Approve & Generate Invoice</span>
              </>
            )}
          </button>

          <button
            disabled={isLoading}
            onClick={handleRejectClick}
            className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold px-4 py-3 rounded-lg hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {isLoading && loading.action === "reject" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Rejecting...</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span>Reject Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Requests() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowOpen, setWindowOpen] = useState(false);
  const [windowToggling, setWindowToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({
    id: null,
    action: null,
  });

  useEffect(() => {
    async function fetchPending() {
      try {
        const [pendingRes, windowRes] = await Promise.all([
          fetch("/api/assessment/pending"),
          fetch("/api/operator/settings/assessment-window"),
        ]);
        const data = await pendingRes.json();
        const { open } = await windowRes.json();
        setAssessments(data.assessments || []);
        setWindowOpen(open);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPending();
  }, []);

  async function handleToggleWindow() {
    setWindowToggling(true);
    try {
      const res = await fetch("/api/operator/settings/assessment-window", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !windowOpen }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      const { open } = await res.json();
      setWindowOpen(open);
      toast.success(
        open
          ? "Assessment window opened — schools can now submit."
          : "Assessment window closed — schools are locked out.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update assessment window.");
    } finally {
      setWindowToggling(false);
    }
  }

  async function handleAction(
    assessment_id: number,
    school_id: string,
    amount: string,
    action: "approve" | "reject",
    reason: string,
  ) {
    setActionLoading({ id: assessment_id, action });

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
          : "Assessment rejected successfully!",
      );

      // Remove from list after successful action
      setAssessments((prev) => prev.filter((a) => a.id !== assessment_id));
    } catch (error) {
      console.error("Error:", error);
      alert("Operation failed. Please try again.");
    } finally {
      setActionLoading({ id: null, action: null });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Self Assessments
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve pending self assessments made by institutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Assessment window toggle */}
            <button
              onClick={handleToggleWindow}
              disabled={windowToggling}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                windowOpen
                  ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
              }`}
              title={
                windowOpen
                  ? "Click to close the assessment window"
                  : "Click to open the assessment window"
              }
            >
              {windowToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : windowOpen ? (
                <LockKeyholeOpen className="w-4 h-4" />
              ) : (
                <LockKeyhole className="w-4 h-4" />
              )}
              {windowOpen ? "Window Open" : "Window Closed"}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-600 font-medium">Pending Reviews</p>
              <p className="text-2xl font-bold text-blue-900">
                {assessments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Cards */}
      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No Pending Assessments
            </h3>
            <p className="text-gray-500">All assessments have been reviewed</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              loading={actionLoading}
              onApprove={() =>
                handleAction(
                  assessment.id,
                  assessment.school_id,
                  assessment.commission_amount,
                  "approve",
                  "",
                )
              }
              onReject={(reason) =>
                handleAction(
                  assessment.id,
                  assessment.school_id,
                  assessment.commission_amount,
                  "reject",
                  reason,
                )
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
