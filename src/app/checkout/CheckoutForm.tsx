// app/checkout/CheckoutForm.tsx
"use client";
/* eslint-disable */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { LucideCircleCheckBig, LucideCircleX } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

interface Props {
  name: string;
  email: string;
  tin: string;
  item: string;
  amount?: string; // may be undefined
}

interface InterswitchResponse {
  amount?: number;
  message?: string;
  paymentReference?: string;
  processorId?: string;
  transactionId?: string;
}

declare global {
  interface Window {
    webpayCheckout?: (request: any) => void;
  }
}

export default function CheckoutForm({
  name,
  email,
  tin,
  item,
  amount: amountParam,
}: Props) {
  const [selectedMethod, setSelectedMethod] = useState<
    "bank-branch" | "web" | ""
  >("");
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "error" | "pending" | "saved" | null
  >(null);
  //   const [paymentResponse, setPaymentResponse] =
  //     useState<InterswitchResponse | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState(name || "");
  const [emailState, setEmailState] = useState(email || "");
  const [tinState, setTinState] = useState(tin || "");
  const [narration, setNarration] = useState(item || "");
  const [amount, setAmount] = useState<number | null>(() => {
    if (!amountParam) return null;
    const n = Number(amountParam);
    return Number.isFinite(n) ? n : null;
  });
  const [date, setDate] = useState("");

  // set date once on mount
  useEffect(() => {
    setDate(formatDate(new Date()));
  }, []);

  // load external script after mount (client-only)
  useEffect(() => {
    const scriptId = "interswitch-webpay";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://newwebpay.interswitchng.com/inline-checkout.js";
      script.async = true;
      script.onload = () => console.log("Webpay script loaded");
      script.onerror = () => console.error("Failed to load Webpay script");
      document.body.appendChild(script);
    }
  }, []);

  const paymentCallback = (response: any) => {
    console.log("Payment Response:", response);
    // Handle success or failure based on response
  };

  const makePaymentWeb = () => {
    if (!amount) {
      console.error("Missing amount");
      return;
    }
    if (window.webpayCheckout) {
      const paymentRequest = {
        merchant_code: "MX146867",
        pay_item_id: "Default_Payable_MX146867",
        txn_ref: `txn_${Date.now()}`,
        site_redirect_url: `${window.location.origin}/payment-success`,
        amount: Math.round(amount * 100), // amount in kobo
        currency: 566,
        mode: "LIVE",
        onComplete: paymentCallback,
      };

      window.webpayCheckout(paymentRequest);
    } else {
      console.error("Webpay script not loaded");
    }
  };

  const handlePayment = () => {
    if (selectedMethod === "web") makePaymentWeb();
    // add other method handlers if needed
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex items-center pt-6 px-6">
        <div className="flex gap-2">
          <Image
            src="/kirs.png"
            alt="kano state"
            width={50}
            height={50}
            className="object-cover"
          />
          <div className="flex flex-col text-[#28a745] font-bold">
            <span className="text-base">Kano State Electronic</span>
            <span className="text-sm">School Management System</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <main className="flex main-container w-[86%] justify-center ">
          {paymentStatus === null && (
            <div className="bg-white mt-4 w-full max-w-3xl rounded-xl shadow-md flex flex-col gap-4 items-center sm:items-start p-8">
              <form className="flex flex-col gap-8 w-full">
                {/* Institution Details */}
                <section>
                  <h2 className="text-sm sm:text-lg font-semibold mb-4">
                    Institution Details
                  </h2>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 w-full">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[#737791]">
                          Name
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-[49%]">
                        <label className="block text-xs sm:text-sm font-medium text-[#737791]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={emailState}
                          onChange={(e) => setEmailState(e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-[49%]">
                        <label className="block text-xs sm:text-sm font-medium text-[#737791]">
                          Tax Identification Number
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={tinState}
                          onChange={(e) => setTinState(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Summary */}
                <section>
                  <h2 className="text-sm sm:text-lg font-semibold mb-4">
                    Payment Summary
                  </h2>
                  <div className="flex flex-col gap-4 w-full">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#737791]">
                        Payment Item
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="w-[49%]">
                        <label className="block text-xs sm:text-sm font-medium text-[#737791]">
                          Amount
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={amount ?? ""}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="w-[49%]">
                        <label className="block text-xs sm:text-sm font-medium text-[#737791]">
                          Date
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={date}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Channel */}
                <section>
                  <h2 className="text-sm sm:text-lg font-semibold mb-4">
                    Payment Channel
                  </h2>
                  <div className="flex gap-2">
                    <div
                      onClick={() => setSelectedMethod("web")}
                      className={`p-2 border-2 rounded-md cursor-pointer ${
                        selectedMethod === "web"
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="flex gap-1 items-center">
                        <span className="text-sm sm:text-base">
                          Interswitch Web
                        </span>
                        <Image
                          src="/interswitch.png"
                          alt="interswitch"
                          width={18}
                          height={6}
                          className=" md:block object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <button
                  type="button"
                  onClick={handlePayment}
                  className="w-full p-3 bg-[#28a745] text-white rounded-md"
                >
                  Pay Now
                </button>
              </form>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="mx-auto mt-16 flex flex-col items-center justify-center text-green-500">
              <LucideCircleCheckBig size={76} />
              <span className="text-2xl font-medium mt-2">Thank you</span>
              <span className="text-center">
                Your payment has been received
              </span>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="mx-auto mt-16 flex flex-col items-center justify-center text-red-500">
              <LucideCircleX size={76} />
              <span className="text-2xl font-medium mt-2">Payment Failed</span>
              <span className="text-center">
                Your payment couldn`&apos;t be processed
              </span>
            </div>
          )}
        </main>
      </div>

      <div className="w-full flex items-center justify-center gap-2 mt-10 p-6">
        <span className=" text-sm text-[#81859C]">Powered by</span>
        <Image
          src="/paypro.png"
          alt="paypro"
          width={52}
          height={12}
          className="object-cover"
        />
      </div>
    </div>
  );
}
