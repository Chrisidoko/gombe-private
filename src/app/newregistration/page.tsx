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
    website: string;
  };

  B: {
    faculties: string;
    modeOfOperation: string[];
    studentPopulation: string;
    populationByLevel: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      PG: string;
    };
    intlStudents: string;
    avgFee: string;
    avgFeeByLevel: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      PG: string;
    };
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
  };

  D: {
    licenceStatus: string;
    prevLicence: string;
    prevAmount: string;
    prevDate: string;
    outstandingPenalties: string;
    penalty: string;
  };
  E: {
    eName: string;
    comments: string;
  };

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const sections = [
  { id: "A", title: "Section A - Registration Details" },
  { id: "B", title: "Section B - Ownership & Governance" },
  { id: "C", title: "Section C - Academic Intent" },
  { id: "D", title: "Section D - Required Documents (to attach)" },
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
      website: "",
    },
    B: {
      faculties: "",
      modeOfOperation: [],
      studentPopulation: "",
      populationByLevel: {
        "100": "",
        "200": "",
        "300": "",
        "400": "",
        "500": "",
        PG: "",
      },
      intlStudents: "",
      avgFee: "",
      avgFeeByLevel: {
        "100": "",
        "200": "",
        "300": "",
        "400": "",
        "500": "",
        PG: "",
      },
      totalRevenue: "",
      academicSession: "",
      weeksPerSemester: "",
      sessionStart: "",
      sessionEnd: "",
      programmes: [],
    },
    C: {
      methodOfCollection: [],
      paymentGateway: "",
      currentGateway: "",
      partnerBanks: "",
      paymentReports: "",
    },

    D: {
      licenceStatus: "",
      prevLicence: "",
      prevAmount: "",
      prevDate: "",
      outstandingPenalties: "",
      penalty: "",
    },
    E: {
      eName: "",
      comments: "",
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
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Proposed Institution Name
                </label>
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
                <label className="text-sm font-medium">CAC Number</label>
                <input
                  type="text"
                  placeholder="CAC Registration Number"
                  value={formData.A.cacNumber}
                  onChange={(e) =>
                    handleChange("A", "cacNumber", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Proprietor Full Name
                </label>
                <input
                  type="text"
                  placeholder="Proprietor/Promoters Full Name"
                  value={formData.A.proprietorName}
                  onChange={(e) =>
                    handleChange("A", "proprietorName", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Proposed Campus Address
                </label>
                <input
                  type="text"
                  placeholder="Proposed Campus Address of Institution"
                  value={formData.A.address}
                  onChange={(e) => handleChange("A", "address", e.target.value)}
                  className="w-full p-2 border rounded border-gray-400 "
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">LGA</label>
                <input
                  type="text"
                  placeholder="LGA"
                  value={formData.A.lga}
                  onChange={(e) => handleChange("A", "lga", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={formData.A.state}
                  onChange={(e) => handleChange("A", "state", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Institutions Email Address
                </label>
                <input
                  type="email"
                  placeholder="Official Email Address"
                  value={formData.A.email}
                  onChange={(e) => handleChange("A", "email", e.target.value)}
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
                  value={formData.A.confirmemail}
                  onChange={(e) =>
                    handleChange("A", "confirmemail", e.target.value)
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
                  value={formData.A.phone}
                  onChange={(e) => handleChange("A", "phone", e.target.value)}
                  className="w-full p-2 border  border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Contact Person</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.A.website}
                  onChange={(e) => handleChange("A", "website", e.target.value)}
                  className="w-full p-2 border  border-gray-400 rounded"
                />
              </div>
            </div>
          )}

          {/* Section B */}
          {currentStep === 1 && (
            <div className="space-y-6 text-sm">
              {/* Trustees */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className=" flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      Board of Trustees/Directors (Enter all names that apply)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Director 1",
                        "Director 2",
                        "Director 3",
                        "Director 4",
                        "Director 5",
                        "Director 6",
                      ].map((level) => (
                        <div key={level} className="flex flex-col">
                          <input
                            type="text"
                            placeholder={` ${level}`}
                            value={
                              formData.B.avgFeeByLevel[
                                level as keyof typeof formData.B.avgFeeByLevel
                              ]
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                B: {
                                  ...prev.B,
                                  avgFeeByLevel: {
                                    ...prev.B.avgFeeByLevel,
                                    [level]: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="p-2 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Type of Ownership
                    </label>
                    <select
                      value={formData.A.ownershipType}
                      onChange={(e) =>
                        handleChange("A", "ownershipType", e.target.value)
                      }
                      className="w-full p-2 border border-gray-400 rounded"
                    >
                      <option value="Private Individual">
                        Private Individual
                      </option>
                      <option value="Faith-Based">Faith-Based</option>
                      <option value="Corporate Body">Corporate Body</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Trustees */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className=" flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      Principal Officers (Enter all names that apply)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["Provost", "Rector", "Registrar", "Bursar"].map(
                        (officers) => (
                          <div key={officers} className="flex flex-col">
                            <input
                              type="text"
                              placeholder={` ${officers}`}
                              value={
                                formData.B.avgFeeByLevel[
                                  officers as keyof typeof formData.B.avgFeeByLevel
                                ]
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  B: {
                                    ...prev.B,
                                    avgFeeByLevel: {
                                      ...prev.B.avgFeeByLevel,
                                      [officers]: e.target.value,
                                    },
                                  },
                                }))
                              }
                              className="p-2 border rounded"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section C */}
          {currentStep === 2 && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Proposed Courses/Programmes
                </label>
                <input
                  type="text"
                  placeholder="Name(s) Courses (Mathematics, Physics, Bio-Chemistry)"
                  value={formData.C.partnerBanks}
                  onChange={(e) =>
                    handleChange("C", "partnerBanks", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Target Start Date of Academic Session
                  </label>
                  <input
                    type="date"
                    placeholder="Payment Date"
                    value={formData.D.prevDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        D: {
                          ...prev.D,
                          prevDate: e.target.value,
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Expected Student Capacity
                  </label>
                  <input
                    type="number"
                    placeholder="Expected Student Capacity"
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
                className="px-6 py-2 bg-gray-400 text-white font-semibold  rounded"
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
