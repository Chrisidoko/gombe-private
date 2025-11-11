"use client";
/* eslint-disable */

import { useState, useEffect } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import Link from "next/link";

type FormData = {
  A: {
    officialName: string;
    registeredForTax: string;
    tin: string;
    lastTaxFiling: string;
    licenseNumber: string;
    lastLicenseRenewal: string;
    category: string;
  };

  B: {
    paymentGateway: string;
    currentGateway: string;
    partnerBanks: string;
    paymentReports: string;
  };

  C: {
    schoolportal: string;
    schoolPortalVendor: string;
    readyForApi: string;
  };

  D: {
    email: string;
    confirmemail: string;
    phone: string;
    website: string;
  };

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const sections = [
  { id: "A", title: "Onboard Form A - Institution Verification" },
  { id: "B", title: "Onboard Form B - Financial & Payment System Information" },
  { id: "C", title: "Onboard Form C - Portal Integration Status" },
  { id: "D", title: "Onboard Form D - Institution information" },
  { id: "E", title: "Onboard Form E - Complete" },
] as const;

export default function PrivateInstitutionsForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    A: {
      officialName: "",
      registeredForTax: "",
      tin: "",
      lastTaxFiling: "",
      licenseNumber: "",
      lastLicenseRenewal: "",
      category: "",
    },
    B: {
      paymentGateway: "",
      currentGateway: "",
      partnerBanks: "",
      paymentReports: "",
    },
    C: {
      schoolportal: "",
      schoolPortalVendor: "",
      readyForApi: "",
    },
    D: {
      email: "",
      confirmemail: "",
      phone: "",
      website: "",
    },
  });

  const [emailError, setEmailError] = useState(""); // to catch email validation error's
  const [loading, setLoading] = useState(false); //loadind state for moving steps to steps
  const router = useRouter(); // to redirect user when done.

  const handleChange = <T extends keyof FormData>(
    section: T,
    field: keyof FormData[T],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < sections.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // const handleSubmit = async () => {
  //   try {
  //     // ✅ Retrieve the stored TIN (from Section A)
  //     const tin = localStorage.getItem("tin");

  //     if (!tin) {
  //       toast.error("Missing TIN. Please complete Section A first.");
  //       return;
  //     }

  //     const res = await fetch("/api/schools/register", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         tin,
  //         formStatus: "completed",
  //       }),
  //     });

  //     const data = await res.json();

  //     if (res.ok && data.success) {
  //       toast.success("Form submitted successfully!");
  //       console.log("Saved record:", data);
  //       // Wait a moment, then redirect
  //       setTimeout(() => {
  //         router.push("/");
  //       }, 4500);
  //     } else {
  //       toast.error(` Submission failed: ${data.error || "Unknown error"}`);
  //     }
  //   } catch (err) {
  //     console.error("Error during submission:", err);
  //     toast.error("⚠️ An error occurred while submitting the form.");
  //   }
  // };

  const saveCurrentSection = async (): Promise<boolean> => {
    setLoading(true);

    try {
      const sectionKey = Object.keys(formData)[currentStep];
      const sectionData = formData[sectionKey] || {};

      setEmailError("");

      // ✅ Validate email only for Section D
      if (sectionKey === "D") {
        const email = (sectionData.email ?? "").toString().trim();
        const confirmEmail = (sectionData.confirmemail ?? "").toString().trim();

        if (!email || !confirmEmail) {
          setEmailError("Please enter and confirm your email address.");
          setLoading(false);
          return false;
        }

        if (email !== confirmEmail) {
          setEmailError("Email addresses do not match. Please recheck.");
          setLoading(false);
          return false;
        }
      }

      // ✅ Remove confirmemail before sending
      const { confirmemail, ...sanitizedData } = sectionData;

      let endpoint = "/api/schools/onboard/create"; // default for first section
      let bodyData: Record<string, any> = {
        section: sectionKey,
        ...sanitizedData,
      };

      if (sectionKey !== "A") {
        endpoint = "/api/schools/onboard/update";

        if (!formData.school_id) {
          toast.error("❗ Missing school ID. Please complete section A first.");
          setLoading(false);
          return false;
        }

        // include generated ID for update
        bodyData.school_id =
          formData.school_id || localStorage.getItem("school_id");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const result = await res.json();

      if (!result.success) {
        console.error("Failed to save section:", result.message);
        toast.error(result.message);
        setLoading(false);
        return false;
      }

      // ✅ If Section A, save returned school_id
      if (sectionKey === "A" && result.school_id) {
        setFormData((prev) => ({ ...prev, school_id: result.school_id }));
        localStorage.setItem("school_id", result.school_id); // optional fallback
        console.log("🎯 Stored school_id:", result.school_id);
      }

      toast.success(`Section ${sectionKey} saved successfully`);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Save error:", err);
      setEmailError("An unexpected error occurred.");
      toast.error("Something went wrong.");
      setLoading(false);
      return false;
    }
  };

  const handleProceed = async () => {
    const success = await saveCurrentSection();
    if (!success) return; // ❌ Stop here if validation or save fails

    nextStep(); // ✅ Move only when successful
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main>
        <Link href="/">
          <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white font-semibold py-3 text-sm transition cursor-pointer">
            <CircleX /> Cancel & Return Home
          </button>
        </Link>
        <div className="max-w-4xl mx-auto py-10 px-4">
          {/* Progress Bar */}
          <div className="flex items-center mb-8">
            {sections.map((section, index) => (
              <div key={section.id} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                ${index <= currentStep ? "bg-[#28a745]" : "bg-gray-300"}`}
                >
                  {section.id}
                </div>
                {index < sections.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      index < currentStep ? "bg-[#28a745]" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Section Title */}
          <h2 className="text-2xl font-semibold mb-6">
            {sections[currentStep].title}
          </h2>

          {/* Section A */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 text-sm md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 md:col-span-3">
                <label className="text-sm font-medium">Institution Name</label>
                <input
                  type="text"
                  placeholder="Official Name of Institution"
                  value={formData.A.officialName}
                  onChange={(e) =>
                    handleChange("A", "officialName", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400  rounded"
                />
              </div>

              <div className="md:col-span-3">
                <h3 className="font-semibold mb-2 ">
                  Is the Institution registered for tax?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="registeredForTax" // 👈 ensures only one is selectable
                        value={option}
                        checked={formData.A.registeredForTax === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            A: {
                              ...prev.A,
                              registeredForTax: option, // 👈 store just a single string value
                            },
                          }));
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">If yes, Enter TIN</label>
                <input
                  type="text"
                  placeholder="Tax Identification Number (TIN)"
                  value={formData.A.tin}
                  onChange={(e) => handleChange("A", "tin", e.target.value)}
                  className={`p-2 border border border-gray-400 rounded ${
                    formData.A.registeredForTax === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={formData.A.registeredForTax === "No"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Last Tax Filing Date
                </label>
                <input
                  type="date"
                  placeholder="Last Tax Filing Date"
                  value={formData.A.lastTaxFiling}
                  onChange={(e) =>
                    handleChange("A", "lastTaxFiling", e.target.value)
                  }
                  className={`w-full p-2 border border-gray-400 rounded ${
                    formData.A.registeredForTax === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={formData.A.registeredForTax === "No"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  State Issued License Number
                </label>
                <input
                  type="text"
                  placeholder="License Number"
                  value={formData.A.licenseNumber}
                  onChange={(e) =>
                    handleChange("A", "licenseNumber", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Last License Renewal
                </label>
                <input
                  type="date"
                  placeholder="Date of Last License Renewal"
                  value={formData.A.lastLicenseRenewal}
                  onChange={(e) =>
                    handleChange("A", "lastLicenseRenewal", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>

              <div className="w-full md:col-span-3">
                <h3 className="font-semibold mb-2">Category</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {["College of Education", "Polytechnic", "University"].map(
                    (prog) => (
                      <label key={prog} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          checked={formData.A.category === prog}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              A: {
                                ...prev.A,
                                category: prog,
                              },
                            }))
                          }
                        />
                        {prog}
                      </label>
                    )
                  )}

                  {/* ✅ Other Option */}
                  <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                    <input
                      type="radio"
                      name="category"
                      checked={formData.A.category?.startsWith("Other:")}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          A: { ...prev.A, category: "Other:" },
                        }))
                      }
                    />
                    <span>Other:</span>

                    <input
                      type="text"
                      placeholder="Specify"
                      value={
                        formData.A.category?.startsWith("Other:")
                          ? formData.A.category.split("Other:")[1] || ""
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          A: {
                            ...prev.A,
                            category: val ? `Other:${val}` : "Other:",
                          },
                        }));
                      }}
                      className="border rounded p-1 w-full md:w-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section B */}
          {currentStep === 1 && (
            <div className="space-y-6 text-sm">
              {/* Financial & Payment System Information */}

              {/* Payment Gateway */}
              <div>
                <h3 className="font-semibold mb-2">
                  Do you use a payment gateway?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentGateway" // 👈 ensures only one is selectable
                        value={option}
                        checked={formData.B.paymentGateway === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            B: {
                              ...prev.B,
                              paymentGateway: option, // 👈 store just a single string value
                            },
                          }));
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  If yes, which one?
                </label>
                <input
                  type="text"
                  placeholder="Name of Payment Gateway"
                  value={formData.B.currentGateway}
                  onChange={(e) =>
                    handleChange("B", "currentGateway", e.target.value)
                  }
                  className={`p-2 border rounded ${
                    formData.B.paymentGateway === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={formData.B.paymentGateway === "No"}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Partner Banks(if any)
                </label>
                <input
                  type="text"
                  placeholder="Name(s) of Partner Banks"
                  value={formData.B.partnerBanks}
                  onChange={(e) =>
                    handleChange("B", "partnerBanks", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Do you generate real-time payment reports?:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentReports" // 👈 ensures only one is selectable
                        value={option}
                        checked={formData.B.paymentReports === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            B: {
                              ...prev.B,
                              paymentReports: option, // 👈 store just a single string value
                            },
                          }));
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section C */}
          {currentStep === 2 && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">
                  Do you have a school portal?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="school portal" // 👈 ensures only one is selectable
                        value={option}
                        checked={formData.C.schoolportal === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
                              schoolportal: option, // 👈 store just a single string value
                            },
                          }));
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Current School Portal Vendor
                </label>
                <input
                  type="text"
                  placeholder="Your School Management System Vendor"
                  value={formData.C.schoolPortalVendor}
                  onChange={(e) =>
                    handleChange("C", "schoolPortalVendor", e.target.value)
                  }
                  disabled={formData.C.schoolportal === "No"}
                  className={`p-2 border rounded ${
                    formData.C.schoolportal === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Will you want integration to the government tax management via
                  API for Tax Auto assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentGateway" // 👈 ensures only one is selectable
                        value={option}
                        checked={formData.C.readyForApi === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
                              readyForApi: option, // 👈 store just a single string value
                            },
                          }));
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section D */}
          {currentStep === 3 && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Institutions Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Official Email Address"
                      value={formData.D.email}
                      onChange={(e) =>
                        handleChange("D", "email", e.target.value)
                      }
                      className="w-full p-2 border border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Confirm Institutions Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Re-enter Official Email Address"
                      value={formData.D.confirmemail}
                      onChange={(e) =>
                        handleChange("D", "confirmemail", e.target.value)
                      }
                      className={`w-full p-2 border rounded ${
                        emailError ? "border-red-500" : "border-gray-400"
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-600 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input
                      type="number"
                      placeholder="Telephone Number"
                      value={formData.D.phone}
                      onChange={(e) =>
                        handleChange("D", "phone", e.target.value)
                      }
                      className="w-full p-2 border  border-gray-400 rounded"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Website</label>
                    <input
                      type="text"
                      placeholder="www.yourwebsite.com"
                      value={formData.D.website}
                      onChange={(e) =>
                        handleChange("D", "website", e.target.value)
                      }
                      className="w-full p-2 border  border-gray-400 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section E - Congratulations */}
          {currentStep === 4 && (
            <div className="flex flex-col bg-gray-200/20 h-96 text-[#28a745] items-center justify-center text-center space-y-5 py-6 rounded-2xl shadow-sm">
              <CircleCheck size={100} />

              <h2 className="text-2xl font-semibold "> Congratulations!</h2>
              <p className="max-w-lg  text-gray-900">
                You&apos;re all set! You may review the details of your
                Institution Registration or Click Submit to send your data and
                return home. We&apos;ll notify you by email immediately
                there&apos;s an approval of your school&apos;s information.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 ? (
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-gray-600 text-white font-semibold  rounded"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {currentStep < sections.length - 1 ? (
              <button
                onClick={handleProceed}
                disabled={loading}
                className={`px-6 py-2 flex items-center justify-center gap-2 rounded bg-[#28a745] text-white font-semibold transition ${
                  loading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-[#218838]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving..</span>
                  </>
                ) : (
                  "Proceed"
                )}
              </button>
            ) : (
              <button
                // onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </main>
      <footer className="mt-auto w-full bg-gray-100 border-t border-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-between text-xs sm:text-sm text-gray-600">
          {/* Left Side */}
          <div className="flex items-center mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="ml-1">
              <Image src="/paypro.png" alt="Logo" width={46} height={46} />
            </span>
            . All Rights Reserved.
          </div>

          {/* Right Side */}
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
