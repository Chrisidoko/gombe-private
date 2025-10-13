"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { LucideCircleCheckBig, LucideCircleX } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

interface InterswitchResponse {
  amount: number;
  message: string;
  paymentReference: string;
  processorId: string;
  transactionId: string;
}

declare global {
  interface Window {
    webpayCheckout?: (request: any) => void;
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const [selectedMethod, setSelectedMethod] = useState<
    "bank-branch" | "web" | ""
  >("");
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "error" | "pending" | "saved" | null
  >(null);
  const [paymentResponse, setPaymentResponse] =
    useState<InterswitchResponse | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [tin, setTIN] = useState("");
  const [narration, setNarration] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState("");

  // Populate state from search params after mount
  useEffect(() => {
    if (!searchParams) return;

    const schoolName = searchParams.get("name");
    const schoolEmail = searchParams.get("email");
    const schoolTIN = searchParams.get("tin");
    const paymentItem = searchParams.get("item");
    const paymentAmount = searchParams.get("amount");

    if (schoolName) setFirstName(schoolName);
    if (schoolEmail) setEmail(schoolEmail);
    if (schoolTIN) setTIN(schoolTIN);
    if (paymentItem) setNarration(paymentItem);
    if (paymentAmount) setAmount(Number(paymentAmount));
  }, [searchParams]);

  // Set current date
  useEffect(() => {
    setDate(formatDate(new Date()));
  }, []);

  // Load Webpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://newwebpay.interswitchng.com/inline-checkout.js";
    script.async = true;
    script.onload = () => console.log("Webpay script loaded");
    script.onerror = () => console.error("Failed to load Webpay script");
    document.body.appendChild(script);
  }, []);

  const paymentCallback = (response: any) => {
    console.log("Payment Response:", response);
    setPaymentResponse(response);
    setPaymentStatus(response.success ? "success" : "error");
  };

  const handlePayment = () => {
    if (selectedMethod === "web") {
      if (window.webpayCheckout && amount) {
        window.webpayCheckout({
          merchant_code: "MX146867",
          pay_item_id: "Default_Payable_MX146867",
          txn_ref: `txn_${Date.now()}`,
          site_redirect_url: "https://yourwebsite.com/payment-success",
          amount: amount * 100,
          currency: 566,
          mode: "LIVE",
          onComplete: paymentCallback,
        });
      } else {
        console.error("Webpay script not loaded or amount missing");
      }
    }
  };

  return (
    <div className="min-h-screen p-6">
      {paymentStatus === null && (
        <div className="bg-white max-w-3xl mx-auto rounded-xl shadow-md p-8 flex flex-col gap-8">
          <h2 className="text-lg font-semibold">Institution Details</h2>
          <input
            type="text"
            placeholder="Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            type="text"
            placeholder="TIN"
            value={tin}
            onChange={(e) => setTIN(e.target.value)}
            className="p-2 border rounded w-full"
          />

          <h2 className="text-lg font-semibold">Payment Summary</h2>
          <input
            type="text"
            placeholder="Payment Item"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount ?? ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="p-2 border rounded w-full"
          />
          <input
            type="text"
            placeholder="Date"
            value={date}
            readOnly
            className="p-2 border rounded w-full bg-gray-100"
          />

          <h2 className="text-lg font-semibold">Payment Channel</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMethod("web")}
              className={`p-2 border rounded ${
                selectedMethod === "web" ? "border-red-500" : "border-gray-300"
              }`}
            >
              Interswitch Web
            </button>
          </div>

          <button
            onClick={handlePayment}
            className="w-full p-3 bg-green-600 text-white rounded-md"
          >
            Pay Now
          </button>
        </div>
      )}

      {paymentStatus === "success" && (
        <div className="mx-auto mt-16 flex flex-col items-center justify-center text-green-500">
          <LucideCircleCheckBig size={76} />
          <span className="text-2xl font-medium mt-2">Thank you</span>
          <span className="text-center">Your payment has been received</span>
        </div>
      )}

      {paymentStatus === "error" && (
        <div className="mx-auto mt-16 flex flex-col items-center justify-center text-red-500">
          <LucideCircleX size={76} />
          <span className="text-2xl font-medium mt-2">Payment Failed</span>
          <span className="text-center">
            Your payment couldn't be processed
          </span>
        </div>
      )}
    </div>
  );
}
