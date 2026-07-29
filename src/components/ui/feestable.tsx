"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
import PaymentModal from "@/components/ui/paymentmodal";
import {
  CheckCircle2,
  Loader2,
  Info,
  Lock,
  XCircle,
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
  reference?: string | null;
  db_id?: number | null;
};

type FeeGroup = {
  category: string;
  stage: number;
  fees: Fee[];
  locked: boolean;
  lockReason?: "active_license" | "assessment_pending" | "stage_incomplete";
};

export default function FeeTable({
  school_id,
  license_status,
  approval_status,
}: {
  school_id: string;
  license_status?: string;
  approval_status?: string;
}) {
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // const router = useRouter();

  const showCertificateFee =
    license_status !== "Active" && approval_status === "approved";

  useEffect(() => {
    async function fetchFees() {
      try {
        const params = new URLSearchParams();
        params.set("school_id", school_id);
        if (showCertificateFee) params.set("show_certificate", "true");
        if (license_status) params.set("license_status", license_status);

        const res = await fetch(`/api/schools/fees?${params.toString()}`, {
          cache: "no-store", // ← make sure this exists on every fetch
        });
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

  async function handleMakePayment(fee: Fee) {
    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/fee-payment/pay-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          db_id: fee.db_id, // ← use db_id which is the actual payment record ID from route file
          school_id: school_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Open payment URL in modal
      setPaymentUrl(data.checkoutUrl);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate checkout",
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function closePaymentModal() {
    setShowPaymentModal(false);
    setPaymentUrl("");

    toast.loading("Verifying payment...", { duration: 5000 });

    await new Promise((resolve) => setTimeout(resolve, 5000));
    window.location.reload();
    // router.refresh();
    // // ← re-fetches server data without full page reload is of the use of "window.location.reload();"
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
          <div>
            <h3 className="text-base font-bold text-white">
              Compliance Standing Schedule
            </h3>
            <p className="text-xs text-green-300">
              Gombe State Ministry of Education — Private Tertiary Institutions
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
                {group.lockReason === "active_license" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700 leading-relaxed font-medium">
                      Your institution currently holds an active certificate. No
                      payment is required at this time. This will become
                      available when your certificate is due for renewal.
                    </p>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      This fee will become available once your assessment
                      questionnaire has been submitted, reviewed, and approved
                      by the Ministry.
                    </p>
                  </>
                )}
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
                      onClick={() => handleMakePayment(fee)} // ← pass full fee not just fee.id
                      disabled={
                        checkoutLoading || checkingStatus || paymentSuccess
                      }
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition ml-auto"
                    >
                      {checkoutLoading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : checkingStatus ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Verifying Payment...</span>
                        </>
                      ) : paymentSuccess ? (
                        <>
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Payment Confirmed</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Make Payment</span>
                        </>
                      )}
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => closePaymentModal()} // will come back to review payment status when modal closes
        paymentUrl={paymentUrl}
      />

      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
