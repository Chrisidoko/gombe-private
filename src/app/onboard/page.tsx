"use client";
/* eslint-disable */

import { useState, useEffect } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck, FileUp } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DocumentItem {
  type: string;
  url: string;
}

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
    email: string;
    confirmemail: string;
    phone: string;
    website: string;
  };

  D: {
    documents: DocumentItem[];
  };

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const sections = [
  { id: "A", title: "Onboard Form A - Institution Verification" },
  { id: "B", title: "Onboard Form B - Financial & Payment System Information" },
  {
    id: "C",
    title: "Onboard Form C - School Portal & Institution information",
  },
  { id: "D", title: "Onboard Form D - State Issued Licence" },
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
      email: "",
      confirmemail: "",
      phone: "",
      website: "",
    },
    D: {
      documents: [] as { type: string; url: string }[], // ✅ Array of objects
    },
  });

  const [selectedType, setSelectedType] = useState("");
  const [emailError, setEmailError] = useState(""); // to catch email validation error's
  const [loading, setLoading] = useState(false); //loadind state for moving steps to steps
  // Add this state at the top of your component
  const [pendingDocument, setPendingDocument] = useState<{
    type: string;
    file: File;
  } | null>(null);

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

  // Modified handleAddDocument - now just stages the file
  const handleStageDocument = (type: string, file: File) => {
    // Validate file size (e.g., 2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
      return;
    }

    setPendingDocument({ type, file });
    toast.success("Document selected. Click 'Proceed' to upload.");
  };

  // New function to actually upload the document
  const uploadPendingDocument = async (): Promise<boolean> => {
    if (!pendingDocument) return true; // No document to upload

    const schoolId = formData.school_id || localStorage.getItem("school_id");

    if (!schoolId) {
      toast.error("School ID is missing. Please complete Section A first.");
      return false;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("file", pendingDocument.file);
    formDataToSend.append("type", pendingDocument.type);
    formDataToSend.append("school_id", String(schoolId));

    try {
      toast.loading("Uploading document...");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();
      toast.dismiss();

      if (result.success) {
        toast.success("Document uploaded successfully!");

        // Add uploaded doc to list
        setFormData((prev: any) => ({
          ...prev,
          D: {
            ...prev.D,
            documents: [
              ...(prev.D.documents || []),
              {
                type: pendingDocument.type,
                url: result.url,
                public_id: result.public_id,
              },
            ],
          },
        }));

        setPendingDocument(null); // Clear pending
        return true;
      } else {
        toast.error(result.message || "Upload failed.");
        return false;
      }
    } catch (err) {
      toast.dismiss();
      console.error("Upload error:", err);
      toast.error("Something went wrong while uploading.");
      return false;
    }
  };

  // Modified saveCurrentSection for Section D
  const saveCurrentSection = async (
    autoProgress: boolean = false
  ): Promise<boolean> => {
    setLoading(true);

    try {
      const sectionKey = Object.keys(formData)[currentStep];
      const sectionData = formData[sectionKey] || {};

      setEmailError("");

      // Email validation for Section C
      if (sectionKey === "C") {
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

      // ✅ Section D: Upload pending document first
      if (sectionKey === "D") {
        // Check if at least one document exists OR pending document to upload
        const docs = formData.D?.documents || [];

        if (docs.length === 0 && !pendingDocument) {
          toast.error("Please upload at least one document.");
          setLoading(false);
          return false;
        }

        // If there's a pending document, upload it first
        if (pendingDocument) {
          const uploadSuccess = await uploadPendingDocument();
          if (!uploadSuccess) {
            setLoading(false);
            return false;
          }
        }

        // ✅ Auto-progress after validation if called from handleProceed
        if (autoProgress) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Short delay
          setLoading(false);
          nextStep(); // Move to next section
          return true; // Return early, skip saving section
        }

        // After upload, verify at least one document exists
        const updatedDocs = formData.D?.documents || [];
        if (updatedDocs.length === 0) {
          toast.error("Please upload at least one document.");
          setLoading(false);
          return false;
        }
      }

      const { confirmemail, ...sanitizedData } = sectionData;

      let endpoint = "/api/schools/onboard/create";
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

      if (sectionKey === "A" && result.school_id) {
        setFormData((prev) => ({ ...prev, school_id: result.school_id }));
        localStorage.setItem("school_id", result.school_id);
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

  // for proceeding to next steps
  const handleProceed = async () => {
    const success = await saveCurrentSection(true); // ✅ Pass true for auto-progress
    if (!success) return;

    // Only call nextStep if not Section D (Section D handles it internally)
    if (currentStep !== 3) {
      nextStep();
    }
  };

  // Add this function to handle finish
  const handleFinish = async () => {
    setLoading(true);

    try {
      // Optional: Make a final API call to mark submission as complete
      // const res = await fetch("/api/schools/onboard/finalize", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ school_id: formData.school_id }),
      // });

      toast.success("Registration submitted successfully!");

      // Wait a moment for the toast to be visible
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Route to home page
      router.push("/");
    } catch (err) {
      console.error("Finish error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Institutions Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Official Email Address"
                    value={formData.C.email}
                    onChange={(e) => handleChange("C", "email", e.target.value)}
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
                    value={formData.C.confirmemail}
                    onChange={(e) =>
                      handleChange("C", "confirmemail", e.target.value)
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
                    type="**numeric**"
                    placeholder="Telephone Number"
                    value={formData.C.phone}
                    pattern="[0-9]*" // Optional: basic validation pattern for numbers
                    onChange={(e) => handleChange("C", "phone", e.target.value)}
                    className="w-full p-2 border  border-gray-400 rounded"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Website</label>
                  <input
                    type="text"
                    placeholder="www.yourwebsite.com"
                    value={formData.C.website}
                    onChange={(e) =>
                      handleChange("C", "website", e.target.value)
                    }
                    className="w-full p-2 border  border-gray-400 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section D */}
          {currentStep === 3 && (
            <div className="space-y-4 text-sm">
              <div>
                {/* Documents Upload */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Select Document Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select a document type --</option>
                      <option value="State Issued License">
                        State Issued License
                      </option>
                    </select>
                  </div>

                  {selectedType && (
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-1 text-sm font-medium">
                        <FileUp size={16} /> Select Document File
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleStageDocument(selectedType, file);
                        }}
                        className="w-full p-2 border border-gray-400 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500">
                        Max 2MB • PDF, JPG, PNG
                      </p>
                    </div>
                  )}
                </div>

                {/* Pending Document Preview */}
                {pendingDocument && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileUp className="text-yellow-600" size={20} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Ready to Upload
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-semibold">
                              {pendingDocument.type}
                            </span>
                            {" • "}
                            {pendingDocument.file.name}
                            {" • "}
                            {(pendingDocument.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDocument(null);

                          toast("Document selection cleared", {
                            icon: "📂",
                          });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      ⚠️ Click "Proceed" below to upload this document
                    </p>
                  </div>
                )}

                {/* Uploaded Documents List */}
                {formData.D.documents.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs">
                        ✓
                      </span>
                      Uploaded Documents ({formData.D.documents.length})
                    </h3>
                    <ul className="space-y-2">
                      {formData.D.documents.map((doc: any, index: number) => (
                        <li
                          key={index}
                          className="flex justify-between items-center bg-green-50 border border-green-300 rounded px-3 py-2"
                        >
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-2"
                          >
                            <FileUp size={14} />
                            {doc.type}
                          </a>
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
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Helper text */}
                {formData.D.documents.length === 0 && !pendingDocument && (
                  <p className="mt-4 text-sm text-gray-500 italic">
                    No documents uploaded yet. Please select and upload at least
                    one document.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section E - Congratulations */}
          {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 px-6">
              {/* Success Icon with Animation */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-full">
                  <CircleCheck
                    size={80}
                    className="text-[#28a745]"
                    strokeWidth={2}
                  />
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  🎉 Congratulations!
                </h2>
                <p className="text-lg text-gray-600 font-medium">
                  Your registration is complete
                </p>
              </div>

              {/* Message */}
              <div className="max-w-2xl space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Your institution registration has been successfully submitted.
                  Our team will review your information and you'll receive an
                  email notification once your school has been approved.
                </p>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-800">
                    <strong>What's next?</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Review typically takes 1-2 days</li>
                    <li>Check your email for approval notification</li>
                    <li>You can log in once approved</li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleFinish}
                disabled={loading}
                className="mt-6 px-8 py-3 bg-[#28a745] hover:bg-[#218838] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Finish & Return Home
                    <span className="text-lg">→</span>
                  </>
                )}
              </button>

              {/* Optional: Back to review */}
              {/* <button
                onClick={() => setCurrentStep(0)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Go back to review details
              </button> */}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 && currentStep < 4 ? (
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded"
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
              //use to be where submit button was
              <></>
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
