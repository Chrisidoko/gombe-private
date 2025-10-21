"use client";
/* eslint-disable */

import { useState } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck } from "lucide-react";
// import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import Link from "next/link";

type FormData = {
  A: {
    officialName: string;
    yearEstablished: string;
    cacNumber: string;
    proprietorName: string;
    chairmanName: string;
    licenseNumber: string;
    lastLicenseRenewal: string;
    ownershipType: string;
    lastTaxFiling: string;
    address: string;
    lga: string;
    state: string;
    email: string;
    confirmemail: string;
    phone: string;
    category: string[];
  };

  B: {
    faculties: string;
    modeOfOperation: string[];
    studentPopulation: string;
    intlStudents: string;
    avgFee: string;
    totalRevenue: string;
    academicSession: string;
    weeksPerSemester: string;
    sessionStart: string;
    sessionEnd: string;
    programmes: string[];
  };

  C: {
    methodOfCollection: string[];
    paymentGateway: string;
    currentGateway: string;
    partnerBanks: string;
    paymentReports: string;
    schoolportal: string;
    methodOfIntegration: string[];
  };

  D: {
    licenceStatus: string;
    prevLicence: string;
    prevAmount: string;
    prevDate: string;
    outstandingPenalties: string;
    penalty: string;
  };

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const sections = [
  { id: "A", title: "Section A - Institutional Verification" },
  { id: "B", title: "Section B - Financial & Payment System Information" },
  { id: "C", title: "Section C - Portal Integration Status" },
] as const;

export default function PrivateInstitutionsForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    A: {
      officialName: "",
      yearEstablished: "",
      cacNumber: "",
      proprietorName: "",
      chairmanName: "",
      licenseNumber: "",
      lastLicenseRenewal: "",
      ownershipType: "",
      lastTaxFiling: "",
      address: "",
      lga: "",
      state: "",
      email: "",
      confirmemail: "",
      phone: "",
      category: [],
    },
    B: {
      faculties: "",
      modeOfOperation: [],
      studentPopulation: "",
      intlStudents: "",
      avgFee: "",
      totalRevenue: "",
      academicSession: "",
      weeksPerSemester: "",
      sessionStart: "",
      sessionEnd: "",
      programmes: [],
    },
    C: {
      methodOfIntegration: [],
      paymentGateway: "",
      currentGateway: "",
      partnerBanks: "",
      paymentReports: "",
      schoolportal: "",
      methodOfCollection: [],
    },

    D: {
      licenceStatus: "",
      prevLicence: "",
      prevAmount: "",
      prevDate: "",
      outstandingPenalties: "",
      penalty: "",
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

  // For general use of all checkboxes
  const toggleCheckbox = (
    section: keyof FormData,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const currentField = prev[section][field];

      // 🧩 Type check before using array methods
      if (Array.isArray(currentField)) {
        const selected = currentField.includes(value)
          ? currentField.filter((item: string) => item !== value)
          : [...currentField, value];

        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: selected,
          },
        };
      }

      // Fallback (in case field is not an array)
      return prev;
    });
  };

  const nextStep = () => {
    if (currentStep < sections.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  //   const handleSubmit = async () => {
  //     try {
  //       // ✅ Retrieve the stored TIN (from Section A)
  //       const tin = localStorage.getItem("tin");

  //       if (!tin) {
  //         toast.error("Missing TIN. Please complete Section A first.");
  //         return;
  //       }

  //       const res = await fetch("/api/schools/register", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           tin,
  //           formStatus: "completed",
  //         }),
  //       });

  //       const data = await res.json();

  //       if (res.ok && data.success) {
  //         toast.success("Form submitted successfully!");
  //         console.log("Saved record:", data);
  //         // Wait a moment, then redirect
  //         setTimeout(() => {
  //           router.push("/");
  //         }, 4500);
  //       } else {
  //         toast.error(` Submission failed: ${data.error || "Unknown error"}`);
  //       }
  //     } catch (err) {
  //       console.error("Error during submission:", err);
  //       toast.error("⚠️ An error occurred while submitting the form.");
  //     }
  //   };

  //   const saveCurrentSection = async (): Promise<boolean> => {
  //     setLoading(true);

  //     try {
  //       const sectionKey = Object.keys(formData)[currentStep];
  //       const sectionData = formData[sectionKey] || {};

  //       setEmailError("");

  //       // ✅ Validate email only for Section A
  //       if (sectionKey === "A") {
  //         const email = (sectionData.email ?? "").toString().trim();
  //         const confirmEmail = (sectionData.confirmemail ?? "").toString().trim();

  //         if (!email || !confirmEmail) {
  //           setEmailError("Please enter and confirm your email address.");
  //           setLoading(false);
  //           return false;
  //         }

  //         if (email !== confirmEmail) {
  //           setEmailError("Email addresses do not match. Please recheck.");
  //           setLoading(false);
  //           return false;
  //         }
  //       }

  //       // ✅ Remove confirmemail before sending
  //       const { confirmemail, ...sanitizedData } = sectionData;

  //       // ✅ Always include TIN — either from current section or stored value
  //       const tinFromStorage = localStorage.getItem("tin");
  //       const tinToUse =
  //         sanitizedData.tin || tinFromStorage || sectionData.tin || "";

  //       const res = await fetch("/api/schools/temp", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           section: sectionKey,
  //           tin: tinToUse,
  //           ...sanitizedData,
  //         }),
  //       });

  //       const result = await res.json();

  //       if (!result.success) {
  //         console.error("Failed to save section:", result.error);

  //         setLoading(false);
  //         return false;
  //       }

  //       console.log(`✅ Section  saved successfully`);
  //       toast.success(` Section ${sectionKey} saved successfully!`);

  //       // ✅ Save TIN from Section A into localStorage (so later sections can reuse it)
  //       if (sectionKey === "A" && sanitizedData.tin) {
  //         localStorage.setItem("tin", String(sanitizedData.tin)); // Please keep in mid that local storage is not good for SSR components
  //         console.log("📦 Saved TIN:", sanitizedData.tin);
  //       }

  //       setLoading(false);
  //       return true;
  //     } catch (err) {
  //       console.error("Save error:", err);
  //       setEmailError("An unexpected error occurred.");
  //       toast.error("Something went wrong.");
  //       setLoading(false);
  //       return false;
  //     }
  //   };

  const handleProceed = async () => {
    // const success = await saveCurrentSection();
    // if (!success) return; // ❌ Stop here if validation or save fails

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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Exsisting License Number
                </label>
                <input
                  type="text"
                  placeholder="License Number"
                  value={formData.A.licenseNumber}
                  onChange={(e) =>
                    handleChange("A", "licenseNumber", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
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

              <div className="md:col-span-3">
                <h3 className="font-semibold mb-2 ">
                  Is the Institution registered for tax?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentGateway" // 👈 ensures only one is selectable
                        value={option}
                        checked={formData.C.paymentGateway === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
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
                <label className="text-sm font-medium">If yes, Enter TIN</label>
                <input
                  type="text"
                  placeholder="Tax Identification Number"
                  value={formData.C.currentGateway}
                  onChange={(e) =>
                    handleChange("C", "currentGateway", e.target.value)
                  }
                  className={`p-2 border rounded ${
                    formData.C.paymentGateway === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={formData.C.paymentGateway === "No"}
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
                  className="w-full p-2 border border-gray-400 rounded"
                  disabled={formData.C.paymentGateway === "No"}
                />
              </div>

              <div className="w-full md:col-span-3">
                <h3 className="font-semibold mb-2">Category</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["College of Education", "Polytechnic", "University"].map(
                    (prog) => (
                      <label key={prog} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.A.category.includes(prog)}
                          onChange={() => toggleCheckbox("A", "category", prog)}
                        />
                        {prog}
                      </label>
                    )
                  )}

                  {/* ✅ Add “Other” option */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.A.category.some((p: string) =>
                        p.startsWith("Other:")
                      )}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          // remove any "Other:" entry if unchecked
                          setFormData((prev) => ({
                            ...prev,
                            A: {
                              ...prev.A,
                              programmes: prev.A.category.filter(
                                (p: string) => !p.startsWith("Other:")
                              ),
                            },
                          }));
                        } else {
                          // add placeholder entry for Other
                          setFormData((prev) => ({
                            ...prev,
                            A: {
                              ...prev.A,
                              category: [...prev.A.category, "Other:"],
                            },
                          }));
                        }
                      }}
                    />
                    <span>Other:</span>
                    <input
                      type="text"
                      placeholder="Specify"
                      value={
                        formData.A.category
                          .find((p: string) => p.startsWith("Other:"))
                          ?.split("Other:")[1] || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          A: {
                            ...prev.A,
                            category: [
                              ...prev.A.category.filter(
                                (p: string) => !p.startsWith("Other:")
                              ),
                              val ? `Other:${val}` : "", // keep empty string if cleared
                            ].filter(Boolean),
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
              <div>
                {/* Method of Collection */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Current Method of Fee Collection (Tick all that apply):
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      "Bank Deposit",
                      "POS",
                      "Transfer",
                      "Online Portal",
                      "Cash",
                    ].map((method) => (
                      <label key={method} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.C.methodOfCollection.includes(
                            method
                          )}
                          onChange={() =>
                            toggleCheckbox("C", "methodOfCollection", method)
                          }
                        />
                        {method}
                      </label>
                    ))}
                    {/* ✅ Add “Other” option */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.B.programmes.some((p: string) =>
                          p.startsWith("Other:")
                        )}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            // remove any "Other:" entry if unchecked
                            setFormData((prev) => ({
                              ...prev,
                              B: {
                                ...prev.B,
                                programmes: prev.B.programmes.filter(
                                  (p: string) => !p.startsWith("Other:")
                                ),
                              },
                            }));
                          } else {
                            // add placeholder entry for Other
                            setFormData((prev) => ({
                              ...prev,
                              B: {
                                ...prev.B,
                                programmes: [...prev.B.programmes, "Other:"],
                              },
                            }));
                          }
                        }}
                      />
                      <span>Others:</span>
                      <input
                        type="text"
                        placeholder="Specify"
                        value={
                          formData.B.programmes
                            .find((p: string) => p.startsWith("Other:"))
                            ?.split("Other:")[1] || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            B: {
                              ...prev.B,
                              programmes: [
                                ...prev.B.programmes.filter(
                                  (p: string) => !p.startsWith("Other:")
                                ),
                                val ? `Other:${val}` : "", // keep empty string if cleared
                              ].filter(Boolean),
                            },
                          }));
                        }}
                        className="border rounded p-1 w-full md:w-auto"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
              </div>

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
                        checked={formData.C.paymentGateway === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
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
                  value={formData.C.currentGateway}
                  onChange={(e) =>
                    handleChange("C", "currentGateway", e.target.value)
                  }
                  className={`p-2 border rounded ${
                    formData.C.paymentGateway === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={formData.C.paymentGateway === "No"}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Partner Banks</label>
                <input
                  type="text"
                  placeholder="Name(s) of Partner Banks"
                  value={formData.C.partnerBanks}
                  onChange={(e) =>
                    handleChange("C", "partnerBanks", e.target.value)
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
                        checked={formData.C.paymentReports === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Annual Fee Revenue (Last Session)
                </label>
                <input
                  type="number"
                  placeholder="Annual Fee Revenue (Last Session)"
                  value={formData.D.prevAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      D: {
                        ...prev.D,
                        prevAmount: e.target.value,
                      },
                    }))
                  }
                  className={`p-2 border rounded ${
                    formData.D.prevLicence === "No"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={formData.D.prevLicence === "No"} // ✅ disable when No
                />
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
                  value={formData.C.partnerBanks}
                  onChange={(e) =>
                    handleChange("C", "partnerBanks", e.target.value)
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
                        checked={formData.C.paymentGateway === option}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
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

              {/* Method of Collection */}
              <div>
                <h3 className="font-semibold mb-2">
                  Preferred Integration Mode
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["API", "Manual Upload"].map((method) => (
                    <label key={method} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.C.methodOfIntegration.includes(
                          method
                        )}
                        onChange={() =>
                          toggleCheckbox("C", "methodOfIntegration", method)
                        }
                      />
                      {method}
                    </label>
                  ))}
                  {/* ✅ Add “Other” option */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.C.methodOfIntegration.some(
                        (p: string) => p.startsWith("Other:")
                      )}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          // remove any "Other:" entry if unchecked
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
                              methodOfIntegration:
                                prev.C.methodOfIntegration.filter(
                                  (p: string) => !p.startsWith("Other:")
                                ),
                            },
                          }));
                        } else {
                          // add placeholder entry for Other
                          setFormData((prev) => ({
                            ...prev,
                            C: {
                              ...prev.C,
                              methodOfIntegration: [
                                ...prev.C.methodOfIntegration,
                                "Other:",
                              ],
                            },
                          }));
                        }
                      }}
                    />
                    <span>Others:</span>
                    <input
                      type="text"
                      placeholder="Specify"
                      value={
                        formData.C.methodOfIntegration
                          .find((p: string) => p.startsWith("Other:"))
                          ?.split("Other:")[1] || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          C: {
                            ...prev.C,
                            methodOfIntegration: [
                              ...prev.C.methodOfIntegration.filter(
                                (p: string) => !p.startsWith("Other:")
                              ),
                              val ? `Other:${val}` : "", // keep empty string if cleared
                            ].filter(Boolean),
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

          {/* Section D */}
          {currentStep === 3 && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Select Document
                    </label>
                    <select
                      value={formData.A.ownershipType}
                      onChange={(e) =>
                        handleChange("A", "ownershipType", e.target.value)
                      }
                      className="w-full p-2 border border-gray-400 rounded"
                    >
                      <option value="CAC Certificate">CAC Certificate</option>
                      <option value="Faith-Based">
                        TIN Registration Document
                      </option>
                      <option value="Corporate Body">
                        Evidence of Site Inspection/Approval
                      </option>
                      <option value="Corporate Body">
                        Feasibility Study / Business Plan
                      </option>
                      <option value="Corporate Body">
                        Proposed Fee Structure
                      </option>
                      <option value="Corporate Body">
                        NDLEA, Fire & Environmental Clearance
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section F - Congratulations */}
          {currentStep === 5 && (
            <div className="flex flex-col bg-green-600 text-white items-center justify-center text-center space-y-5 py-6 rounded-2xl shadow-sm">
              <CircleCheck size={100} />

              <h2 className="text-2xl font-semibold ">🎉 Congratulations!</h2>
              <p className="max-w-lg ">
                You&apos;re all set! Please review the details of your Private
                Institution Registration. Click Submit to send your data.
                We&apos;ll notify you by email immediately there&apos;s an
                approval of your school&apos;s information.
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
