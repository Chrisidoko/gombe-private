"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ListChecks,
  CheckCircle2,
  Loader2,
  Info,
  Lock,
  XCircle,
  Download,
  Upload,
  CreditCard,
} from "lucide-react";

type Fee = {
  id: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  mandatory: boolean;
  status: "paid" | "unpaid" | "pending";
  stage: number;
  document_url?: string;
  doc_approval?: "pending" | "approved" | "rejected";
};

type FeeGroup = {
  category: string;
  stage: number;
  fees: Fee[];
  locked: boolean;
};

export default function FeeTable({
  programmes,
  school_id,
  license_status,
  approval_status,
}: {
  programmes?: string[];
  school_id: string;
  license_status?: string;
  approval_status?: string;
}) {
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);
  const [uploading, setUploading] = useState<number | null>(null); // tracks which fee_id is uploading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const showCertificateFee =
    license_status !== "Active" && approval_status === "approved";

  useEffect(() => {
    async function fetchFees() {
      try {
        const params = new URLSearchParams();
        if (programmes?.length)
          params.set("programmes", JSON.stringify(programmes));
        params.set("school_id", school_id);
        if (showCertificateFee) params.set("show_certificate", "true");

        const res = await fetch(`/api/schools/fees?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch fees");
        const data = await res.json();
        setFeeGroups(data);
      } catch {
        setError("Could not load fee schedule.");
      } finally {
        setLoading(false);
      }
    }
    fetchFees();
  }, [school_id, showCertificateFee]);

  const total = feeGroups
    .filter((g) => !g.locked)
    .flatMap((g) => g.fees)
    .filter((f) => f.status !== "paid")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPaid = feeGroups
    .flatMap((g) => g.fees)
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.amount, 0);

  async function handleUploadForm(file: File, feeId: number) {
    setUploading(feeId);
    try {
      // Step 1 — upload the file
      const payload = new FormData();
      payload.append("file", file);
      payload.append("type", "Application Form");
      payload.append("school_id", school_id);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });
      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        toast.error("Upload failed.");
        return;
      }

      // Step 2 — update DB to record document has been uploaded
      const updateRes = await fetch("/api/schools/fees/upload-doc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id,
          fee_id: feeId,
          document_url: uploadResult.url, // save the uploaded file URL too
        }),
      });

      if (updateRes.ok) {
        toast.success("Form uploaded successfully.");
      } else {
        toast.error("Failed to record upload.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUploading(null);
    }
  }

  function handleMakePayment(fee: Fee) {
    // router.push(`/payment?fee_id=${fee.id}&amount=${fee.amount}&school_id=${school_id}&fee_name=${encodeURIComponent(fee.name)}`);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Compliance Standing Schedule
            </h3>
            <p className="text-xs text-green-300">
              Kaduna State Ministry of Education — Private Tertiary Institutions
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-green-300 uppercase tracking-widest">
            Balance Due
          </p>
          <p className="text-xl font-black text-white">
            ₦{total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Notice strip */}
      <div className="flex items-center gap-2 bg-yellow-50 border-b border-yellow-100 px-6 py-2.5">
        <Info className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
        <p className="text-xs text-yellow-700">
          All fees are non-refundable. Subsequent stages unlock after previous
          fees are paid and conditions are met.
        </p>
      </div>

      {/* Fee groups */}
      <div className="divide-y divide-gray-100">
        {feeGroups.map((group) => (
          <div
            key={group.category}
            className={group.locked ? "opacity-60" : ""}
          >
            {/* Category header */}
            <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold">
                  {group.stage}
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {group.category}
                </p>
              </div>
              {group.locked && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Lock className="w-3 h-3" />
                  <span>
                    {group.category === "Certificate Fee"
                      ? "Requires assessment approval"
                      : "Complete previous stage to unlock"}
                  </span>
                </div>
              )}
            </div>

            {/* Lock explanation for certificate fee */}
            {group.locked && group.category === "Certificate Fee" && (
              <div className="mx-6 my-3 flex items-start gap-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3">
                <Lock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  This fee will become available once your assessment
                  questionnaire has been submitted, reviewed, and approved by
                  the Ministry.
                </p>
              </div>
            )}

            {/* Fee rows */}
            {group.fees.map((fee, index) => (
              <div
                key={fee.id}
                className={`flex items-start justify-between px-6 py-4 gap-4 transition-colors ${
                  group.locked ? "cursor-not-allowed" : "hover:bg-gray-50"
                } ${
                  index !== group.fees.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                {/* Left */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                      fee.status === "paid"
                        ? "bg-green-100"
                        : group.locked
                          ? "bg-gray-100"
                          : "bg-red-50"
                    }`}
                  >
                    {fee.status === "paid" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : group.locked ? (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">
                        {fee.name}
                      </p>
                      {fee.mandatory && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wide">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {fee.description}
                    </p>

                    {/* Document actions — visible only when paid */}
                    {fee.status === "paid" && fee.document_url && (
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Download — all paid fees with a document */}
                        <a
                          href={fee.document_url}
                          download
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Document
                        </a>

                        {/* Upload inside document actions */}
                        {fee.id === 4 && (
                          <>
                            {fee.doc_approval === "pending" ? (
                              // Doc uploaded — awaiting ministry approval
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-600">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Awaiting Approval
                              </span>
                            ) : (
                              // No doc yet — show upload button
                              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-800 transition cursor-pointer">
                                <Upload className="w-3.5 h-3.5" />
                                {uploading === fee.id
                                  ? "Uploading..."
                                  : "Upload Completed Form"}
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadForm(file, fee.id);
                                  }}
                                />
                              </label>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="shrink-0 text-right space-y-2">
                  <p className="text-sm font-bold text-gray-800">
                    ₦{fee.amount.toLocaleString()}
                  </p>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      fee.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : fee.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-50 text-red-500"
                    }`}
                  >
                    {fee.status}
                  </span>

                  {/* Make Payment button */}
                  {fee.status === "unpaid" && !group.locked && (
                    <button
                      onClick={() => handleMakePayment(fee)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition ml-auto"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Make Payment
                    </button>
                  )}

                  {/* Pending state — waiting for confirmation */}
                  {fee.status === "pending" && (
                    <p className="text-[10px] text-yellow-600 font-medium">
                      Awaiting confirmation
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer totals */}
      <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 space-y-2">
        {totalPaid > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Amount Paid</span>
            <span className="font-semibold text-green-600">
              ₦{totalPaid.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Balance Due</p>
          <div className="text-right">
            <p className="text-xl font-black text-[#1a5c2e]">
              ₦{total.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              Excluding locked fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
