"use client";
/* eslint-disable */

import { useState } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck, FileUp } from "lucide-react";
// import toast from "react-hot-toast";
//import { useRouter } from "next/navigation";

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
    schoolContact: string;
    contactDesignation: string;
    contactPhone: string;
    ownershipType: string;
    category: string[];
  };

  D: {
    licenceStatus: string;
    prevLicence: string;
    prevAmount: string;
    prevDate: string;
    outstandingPenalties: string;
    penalty: string;
    documents: [];
  };
  E: {
    eName: string;
    comments: string;
  };

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const lgas = [
  "Ajingi",
  "Albasu",
  "Bagwai",
  "Bebeji",
  "Bichi",
  "Bunkure",
  "Dala",
  "Dambatta",
  "Dawakin Kudu",
  "Dawakin Tofa",
  "Doguwa",
  "Fagge",
  "Gabasawa",
  "Garko",
  "Garun Mallam",
  "Gaya",
  "Gezawa",
  "Gwale",
  "Gwarzo",
  "Kabo",
  "Kano Municipal",
  "Karaye",
  "Kibiya",
  "Kiru",
  "Kumbotso",
  "Kunchi",
  "Kura",
  "Madobi",
  "Makoda",
  "Minjibir",
  "Nasarawa",
  "Rano",
  "Rimin Gado",
  "Rogo",
  "Shanono",
  "Sumaila",
  "Takai",
  "Tarauni",
  "Tofa",
  "Tsanyawa",
  "Tudun Wada",
  "Ungogo",
  "Warawa",
  "Wudil",
];

const sections = [
  { id: "A", title: "New Registration A - Registration Details" },
  { id: "B", title: "New Registration  B - Ownership & Governance" },
  { id: "C", title: "New Registration  C - Required Documents (to attach)" },
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
      schoolContact: "",
      contactDesignation: "",
      contactPhone: "",
      ownershipType: "",
      category: [],
    },

    D: {
      licenceStatus: "",
      prevLicence: "",
      prevAmount: "",
      prevDate: "",
      outstandingPenalties: "",
      penalty: "",
      documents: [], // each item will look like { type: string, file: File | null }
    },
    E: {
      eName: "",
      comments: "",
    },
  });
  const [selectedType, setSelectedType] = useState("");
  const [emailError, setEmailError] = useState(""); // to catch email validation error's
  const [loading, setLoading] = useState(false); //loadind state for moving steps to steps
  // const router = useRouter(); // to redirect user when done.

  const handleAddDocument = (type: string, file: File) => {
    setFormData((prev: any) => ({
      ...prev,
      D: {
        ...prev.D,
        documents: [...prev.D.documents, { type, file }],
      },
    }));
  };

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
                  Proposed School Address
                </label>
                <input
                  type="text"
                  placeholder="Proposed Address of Institution"
                  value={formData.A.address}
                  onChange={(e) => handleChange("A", "address", e.target.value)}
                  className="w-full p-2 border rounded border-gray-400 "
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">LGA</label>
                <select
                  value={formData.A.lga}
                  onChange={(e) => handleChange("A", "lga", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                >
                  <option value="">Select LGA</option>
                  {lgas.sort().map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
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
                <label className="text-sm font-medium">Official Phone</label>
                <input
                  type="**numeric**"
                  placeholder="Telephone Number"
                  value={formData.A.phone}
                  pattern="[0-9]*" // Optional: basic validation pattern for numbers
                  onChange={(e) => handleChange("A", "phone", e.target.value)}
                  className="w-full p-2 border  border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Website</label>
                <input
                  type="text"
                  placeholder="www.yourwebsite.com"
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
                  {/* <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      Board of Trustees / Director(s)
                    </label>

                    {formData.B.directors.map((name, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder={`Board of Trustee or Director ${
                            index + 1
                          }`}
                          value={name}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const updated = [...prev.B.directors];
                              updated[index] = e.target.value;
                              return {
                                ...prev,
                                B: {
                                  ...prev.B,
                                  directors: updated,
                                },
                              };
                            })
                          }
                          className="p-2 border rounded w-full"
                        />
                        {formData.B.directors.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                B: {
                                  ...prev.B,
                                  directors: prev.B.directors.filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                            className="px-3 py-2 bg-red-500 text-white rounded"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          B: {
                            ...prev.B,
                            directors: [...prev.B.directors, ""],
                          },
                        }))
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      + Add Director
                    </button>
                  </div> */}
                </div>
              </div>

              {/* Trustees 2 */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      School Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="Name of School Contact Person"
                      value={formData.B.schoolContact}
                      onChange={(e) =>
                        handleChange("B", "schoolContact", e.target.value)
                      }
                      className="w-full p-2 border  border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      School Contact Person Designation
                    </label>
                    <input
                      type="text"
                      placeholder="(e.g Registrar, Bursar, etc)"
                      value={formData.B.contactDesignation}
                      onChange={(e) =>
                        handleChange("B", "contactDesignation", e.target.value)
                      }
                      className="w-full p-2 border  border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      School Contact Person Phone
                    </label>
                    <input
                      type="**numeric**"
                      placeholder="Telephone Number"
                      value={formData.B.contactPhone}
                      pattern="[0-9]*" // Optional: basic validation pattern for numbers
                      onChange={(e) =>
                        handleChange("B", "contactPhone", e.target.value)
                      }
                      className="w-full p-2 border  border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Type of School Ownership
                    </label>
                    <select
                      value={formData.B.ownershipType}
                      onChange={(e) =>
                        handleChange("B", "ownershipType", e.target.value)
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
                  <div className="w-full md:col-span-3">
                    <h3 className="font-semibold mb-2">Category</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "College of Education",
                        "Polytechnic",
                        "University",
                      ].map((prog) => (
                        <label key={prog} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.B.category.includes(prog)}
                            onChange={() =>
                              toggleCheckbox("A", "category", prog)
                            }
                          />
                          {prog}
                        </label>
                      ))}

                      {/* ✅ Add “Other” option */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.B.category.some((p: string) =>
                            p.startsWith("Other:")
                          )}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              // remove any "Other:" entry if unchecked
                              setFormData((prev) => ({
                                ...prev,
                                A: {
                                  ...prev.A,
                                  programmes: prev.B.category.filter(
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
                                  category: [...prev.B.category, "Other:"],
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
                            formData.B.category
                              .find((p: string) => p.startsWith("Other:"))
                              ?.split("Other:")[1] || ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              B: {
                                ...prev.B,
                                category: [
                                  ...prev.B.category.filter(
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
              </div>
            </div>
          )}

          {/* Section C*/}
          {currentStep === 2 && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Select Document
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded"
                    >
                      <option value="">-- Select a document type --</option>
                      <option value="CAC Certificate">CAC Certificate</option>
                      <option value="TIN Registration Document">
                        TIN Registration Document
                      </option>
                      <option value="Evidence of Site Inspection/Approval">
                        Evidence of Site Inspection/Approval
                      </option>
                      <option value="Feasibility Study / Business Plan">
                        Feasibility Study / Business Plan
                      </option>
                      <option value="Proposed Fee Structure">
                        Proposed Fee Structure
                      </option>
                      <option value="NDLEA, Fire & Environmental Clearance">
                        NDLEA, Fire & Environmental Clearance
                      </option>
                    </select>
                  </div>

                  {selectedType && (
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-1 text-sm font-medium">
                        <FileUp size={16} /> Upload Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAddDocument(selectedType, file);
                        }}
                        className="w-full p-2 border border-gray-400 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* ✅ Show uploaded documents */}
                {formData.D.documents.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">
                      Uploaded Documents
                    </h3>
                    <ul className="space-y-2">
                      {formData.D.documents.map((doc: any, index: number) => (
                        <li
                          key={index}
                          className="flex justify-between items-center bg-gray-50 border border-gray-300 rounded px-3 py-2"
                        >
                          <span className="text-sm text-gray-700">
                            {doc.type}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                D: {
                                  ...prev.D,
                                  documents: prev.D.documents.filter(
                                    (_: any, i: number) => i !== index
                                  ),
                                },
                              }))
                            }
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
