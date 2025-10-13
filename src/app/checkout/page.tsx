"use client";

/* eslint-disable */
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { LucideCircleCheckBig, LucideCircleX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/formatDate";

export const dynamic = "force-dynamic"; //disable SSR for this page entirely

interface interswitchResponse {
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

// Separate component that uses useSearchParams

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const [selectedMethod, setSelectedMethod] = useState<
    "bank-branch" | "web" | ""
  >("");

  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "error" | "pending" | "saved" | null
  >(null);

  const [paymentResponse, setPaymentResponse] =
    useState<interswitchResponse | null>(null);

  //interswitch response
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

  useEffect(() => {
    const now = new Date();
    setDate(formatDate(now)); // ✅ using existing formatter here
  }, []);

  const handlePayment = () => {
    if (selectedMethod === "bank-branch") {
      // makePayment2(); // Call the makePayment2 function
    } else if (selectedMethod === "web") {
      makePayment3(); // Call the makePayment3 function
    }
  };
  //bank branch stop

  //Interswitch Web Pay script loader
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
    // Handle success or failure based on response
  };

  const makePayment3 = () => {
    if (window.webpayCheckout && amount) {
      const paymentRequest = {
        merchant_code: "MX146867",
        pay_item_id: "Default_Payable_MX146867",
        txn_ref: `txn_${Date.now()}`,
        site_redirect_url: "https://yourwebsite.com/payment-success",
        amount: amount * 100,
        currency: 566, // Nigerian Naira
        onComplete: paymentCallback,
        mode: "LIVE", // Change to "LIVE" in production
      };

      window.webpayCheckout(paymentRequest);
    } else {
      console.error("Webpay script not loaded");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex items-center pt-6 px-6">
        {" "}
        {/* <Link href="/">
          <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white text-sm font-semibold py-3 px-2 rounded-lg ">
            <CircleX /> Cancel
          </button>
        </Link> */}
        <div className="flex gap-2">
          <Image
            src="/kirs.png"
            alt="kano state"
            width={50}
            height={50}
            className=" md:block object-cover"
          />
          <div className="flex flex-col text-[#28a745] font-bold">
            <span className="text-base ">Kano State Electronic</span>
            <span className="text-sm ">School Management System</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <main className="flex main-container w-[86%] justify-center ">
          {paymentStatus === null && (
            <div className="bg-[#ffffff] mt-4 w-full max-w-3xl rounded-xl shadow-md flex flex-col gap-4 items-center sm:items-start p-8">
              <form className="flex flex-col gap-8 w-full ">
                {/* Personal Details Section */}
                <section>
                  <h2 className="text-sm sm:text-lg font-semibold mb-4">
                    Institution Details
                  </h2>
                  <div className="flex flex-col gap-4 ">
                    <div className="flex flex-col gap-4 w-full">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-xs sm:text-sm font-medium text-[#737791]"
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={firstName} // Display the combined name
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-[49%]">
                        <label
                          htmlFor="email"
                          className="block text-xs sm:text-sm font-medium text-[#737791]"
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="w-full p-2 border border-[#e6e7eb]  text-gray-600 bg-gray-100 font-base rounded-md"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-[49%]">
                        <label
                          htmlFor="name"
                          className="block text-xs sm:text-sm font-medium text-[#737791]"
                        >
                          Tax Identification Number
                        </label>
                        <input
                          type="text"
                          id="tin"
                          name="tin"
                          className="w-full p-2 border border-[#e6e7eb]  text-gray-600 bg-gray-100 font-base rounded-md"
                          value={tin}
                          onChange={(e) => setTIN(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Summary Section */}
                <section>
                  <h2 className="text-sm sm:text-lg font-semibold mb-4">
                    Payment Summary
                  </h2>
                  <div className="flex flex-col gap-4 w-full">
                    {/* Payment Item */}
                    <div>
                      <label
                        htmlFor="item"
                        className="block text-xs sm:text-sm font-medium text-[#737791]"
                      >
                        Payment Item
                      </label>
                      <input
                        type="text"
                        id="item"
                        name="item"
                        className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        required
                      />
                    </div>

                    {/* Amount and Date */}
                    <div className="flex gap-4">
                      {/* Amount */}
                      <div className="w-[49%]">
                        <label
                          htmlFor="amount"
                          className="block text-xs sm:text-sm font-medium text-[#737791]"
                        >
                          Amount
                        </label>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          className="w-full p-2 border border-[#e6e7eb] text-gray-600 bg-gray-100 font-base rounded-md"
                          value={amount ?? ""} // If amount is null, show an empty string
                          onChange={(e) => setAmount(Number(e.target.value))}
                          required
                        />
                      </div>

                      {/* Date */}
                      <div className="w-[49%]">
                        <label
                          htmlFor="date"
                          className="block text-xs sm:text-sm font-medium text-[#737791]"
                        >
                          Date
                        </label>
                        <input
                          type="text"
                          id="date"
                          name="date"
                          value={date}
                          className="w-full p-2 border border-[#e6e7eb]  text-gray-600 bg-gray-100 font-base rounded-md"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Method Section */}
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
                    {/* <div
                      onClick={() => setSelectedMethod("bank-branch")}
                      className={`p-2 border-2 rounded-md cursor-pointer ${
                        selectedMethod === "bank-branch"
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="flex gap-1 items-center">
                        <span>Interswitch Bank Branch</span>
                        <Image
                          src="/interswitch.png"
                          alt="interswitch"
                          width={18}
                          height={6}
                          className=" md:block object-contain"
                        />
                      </div>
                    </div> */}
                  </div>
                </section>

                <button
                  type="button"
                  onClick={handlePayment}
                  className="w-full p-3 bg-[#28a745] text-white rounded-md hover:bg-[#23913b]"
                >
                  Pay Now
                </button>
              </form>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="mx-auto mt-16 flex flex-col items-center justify-center text-green-500">
              <LucideCircleCheckBig size={76} />
              <span className="text-[#151D48]  text-2xl  font-medium mt-2 ">
                Thank you
              </span>
              <span className="text-[#151D48] text-2xl text-center font-medium">
                Your payment has been received
              </span>
              <span className="text-[#666666] text-md font-light mt-3">
                Redirecting back to your school portal
              </span>
              <div className=" mt-8  w-full h-[40vh] p-4 rounded text-[#737791]">
                <div className="flex justify-between">
                  <span className=" text-green-500">Amount: </span>
                  <span>{paymentResponse?.amount}</span>
                </div>
                <div>
                  <span className="text-green-500">Message: </span>
                  <span>{paymentResponse?.message}</span>
                </div>
                <div className="flex justify-between">
                  <span className=" text-green-500"> Payment Reference: </span>
                  <span>{paymentResponse?.paymentReference}</span>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="mx-auto mt-16 flex flex-col items-center justify-center text-[#FE332D]">
              <LucideCircleX size={76} />
              <span className="text-[#151D48] text-2xl font-medium mt-2 ">
                Payments Failed
              </span>
              <span className="text-[#151D48] text-2xl text-center font-medium">
                Your payment couldn't be processed at this time
              </span>
              <span className="text-[#666666] text-md font-light mt-3">
                Redirecting back to your school portal
              </span>
              <div className=" mt-8  w-full h-[40vh] p-4 rounded text-[#737791]">
                <div className="flex justify-between">
                  <span className=" text-green-500">Amount: </span>
                  <span>{paymentResponse?.amount}</span>
                </div>
                <div>
                  <span className="text-green-500">Message: </span>
                  <span>{paymentResponse?.message}</span>
                </div>
                <div className="flex justify-between">
                  <span className=" text-green-500"> Payment Reference: </span>
                  <span>{paymentResponse?.paymentReference}</span>
                </div>
              </div>
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
          className=" md:block object-cover"
        />
      </div>
    </div>
  );
}
