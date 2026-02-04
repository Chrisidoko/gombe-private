// app/checkout/CheckoutClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatDate";
import toast from "react-hot-toast";
import PaymentModal from "@/components/ui/paymentmodal";

interface InvoiceData {
  id: number;
  invoice_number: string;
  school_id: string;
  school_name: string;
  school_email: string;
  item: string;
  amount: number;
  status: string;
  bill_reference: string;
}

interface CheckoutClientProps {
  invoiceData: InvoiceData;
}

export default function CheckoutClient({ invoiceData }: CheckoutClientProps) {
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showLicensePreview, setShowLicensePreview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downloadingLicense, setDownloadingLicense] = useState(false);

  const handleDownloadLicense = async () => {
    try {
      setDownloadingLicense(true);

      const response = await fetch("/api/generate-license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_id: invoiceData.school_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate license");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `license-${invoiceData.school_id}-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("License downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download license. Please try again.");
    } finally {
      setDownloadingLicense(false);
    }
  };

  async function handleCheckout() {
    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: invoiceData.id,
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

  async function checkPaymentStatus() {
    if (!invoiceData.bill_reference) {
      toast.error("No bill reference found");
      return;
    }

    setCheckingStatus(true);

    try {
      const response = await fetch(
        `/api/payments/check-status?bill_reference=${invoiceData.bill_reference}`,
        {
          method: "GET",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check payment status");
      }
      if (data.payment_status === "paid") {
        // Update the database with license information
        try {
          const updateResponse = await fetch("/api/license/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              school_id: invoiceData.school_id, // Pass the school_id from your invoice data
              bill_reference: invoiceData.bill_reference, // Optional: for logging/tracking (might use later)
            }),
          });

          const updateData = await updateResponse.json();

          if (!updateResponse.ok) {
            throw new Error(updateData.error || "Failed to update license");
          }

          setPaymentSuccess(true);
          toast.success(
            `Payment confirmed! License ${updateData.data.license_number} has been issued.`,
          );

          // Redirect to dashboard or success page after 3 seconds
          // setTimeout(() => {
          //   router.push("/");
          // }, 3000);
        } catch (updateError) {
          console.error("License update error:", updateError);
          toast.error(
            "Payment confirmed but failed to update license. Please contact support.",
          );
        }
      } else {
        toast.error(
          "Payment not confirmed yet. Please complete the payment or try again.",
        );
      }
    } catch (error) {
      console.error("Status check error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to verify payment status",
      );
    } finally {
      setCheckingStatus(false);
    }
  }

  async function closePaymentModal() {
    setShowPaymentModal(false);
    setPaymentUrl("");

    // Check payment status after closing modal
    toast.loading("Verifying payment status...", { duration: 2000 });

    // Wait a moment for payment to process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await checkPaymentStatus();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            License Renewal Checkout
          </h1>
          <p className="mt-2 text-gray-600">
            Complete your payment to renew your license
          </p>
        </div>

        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-6 animate-fade-in">
            <div className="flex items-start">
              <svg
                className="w-8 h-8 text-green-600 mt-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-green-900">
                  Payment Successful!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your payment has been confirmed. Your license is ready to
                  download.
                </p>

                {/* Download Button */}
                <button
                  onClick={handleDownloadLicense}
                  disabled={downloadingLicense}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingLicense ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                      Generating License...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download License
                    </>
                  )}
                </button>

                <p className="mt-3 text-sm text-green-600">
                  ← Back to Dashboard
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Content - Left Side */}
          <div className="space-y-6">
            {/* Invoice Details Card */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Invoice Details
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Invoice Number:</span>
                  <span className="font-semibold text-gray-900">
                    {invoiceData.invoice_number}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">School Name:</span>
                  <span className="font-semibold text-gray-900">
                    {invoiceData.school_name}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">School ID:</span>
                  <span className="font-semibold text-gray-900">
                    {invoiceData.school_id}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">
                    {invoiceData.school_email}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Item:</span>
                  <span className="font-semibold text-gray-900">
                    {invoiceData.item}
                  </span>
                </div>

                <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg mt-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₦{invoiceData.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    After Payment
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mr-2 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Your license will be made available for download
                      immediately after payment{" "}
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mr-2 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      You will receive a payment confirmation
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mr-2 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      A copy will also be available in your dashboard
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || checkingStatus || paymentSuccess}
              className="w-full bg-[#28a745] text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Proceed to Payment</span>
                </>
              )}
            </button>

            {/* Manual Check Button */}
            {/* {!paymentSuccess && (
              <button
                onClick={checkPaymentStatus}
                disabled={checkingStatus || !invoiceData.bill_reference}
                className="w-full mt-3 border-2 border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {checkingStatus ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Check Payment Status</span>
                  </>
                )}
              </button>
            )} */}

            {/* Back Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Back to Overview
              </button>
            </div>
          </div>

          {/* License Preview - Right Side */}
          <div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden sticky top-8">
              <div className="bg-[#fbbf23] p-4 text-white">
                <h3 className="text-lg text-black font-semibold">
                  License Preview
                </h3>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    This is a sample of what your license will look like:
                  </p>

                  {/* License Preview Image/Mockup */}
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div
                      className="aspect-[4.5/5] relative p-6"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(25,155,57,0.2), rgba(25,155,57,1.0)), url('/license-preview.png')",
                        backgroundSize: "516px",
                        backgroundPosition: "top",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      {/* License Info */}
                      <div className="mt-[28%] space-y-2 text-xs">
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">School Name</p>
                          <p className="font-semibold">
                            {invoiceData.school_name}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">School ID</p>
                          <p className="font-semibold">
                            {invoiceData.school_id}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">License Type</p>
                          <p className="font-semibold">Annual Renewal</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">Valid Until</p>
                          <p className="font-semibold">
                            {formatDate(
                              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Watermark */}
                      <div className="absolute bottom-4 right-4 opacity-10 transform rotate-12">
                        <svg
                          className="w-24 h-24 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowLicensePreview(!showLicensePreview)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium mt-3"
                >
                  {showLicensePreview ? "Hide" : "View"} Full Preview
                </button>

                {showLicensePreview && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <p className="mb-2">
                      <strong>Note:</strong> The actual license will include:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Official school name</li>
                      <li>Unique license number</li>
                      <li>Digital signature</li>
                      <li>QR code for verification</li>
                      <li>Watermark and security features</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={closePaymentModal}
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
