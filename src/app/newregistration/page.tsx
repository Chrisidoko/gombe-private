"use client";
/* eslint-disable */

import { useState } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck, FileUp } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GOMBE_LGAS, SCHOOL_CATEGORIES } from "@/lib/schoolIdConstants";

// Type definitions
interface PendingDocument {
  type: string;
  file: File;
  id: string; // Unique ID for each pending document
}

interface UploadedDocument {
  type: string;
  url: string;
  public_id: string;
}

type FormData = {
  A: {
    officialName: string;
    cacNumber: string;
    proprietorName: string;
    address: string;
    lga: string;
    category: string;
    email: string;
    confirmemail: string;
    phone: string;
    website: string;
  };

  B: {
    contact_person: string;
    contact_person_designation: string;
    contact_person_phone: string;
    ownershipType: string;
  };

  C: {
    documents: PendingDocument[];
  };

  D: Record<string, never>; // Empty object type - Section D has no fields

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const sections = [
  { id: "A", title: "New Registration A - Registration Details" },
  { id: "B", title: "New Registration  B - Ownership & Governance" },
  {
    id: "C",
    title: "New Registration  C - Required Documents (Upload All that Apply)",
  },
  {
    id: "D",
    title: "New Registration D - Complete)",
  },
] as const;

export default function PrivateInstitutionsForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    A: {
      officialName: "",
      cacNumber: "",
      proprietorName: "",
      address: "",
      lga: "",
      category: "",
      email: "",
      confirmemail: "",
      phone: "",
      website: "",
    },
    B: {
      contact_person: "",
      contact_person_designation: "",
      contact_person_phone: "",
      ownershipType: "",
    },

    C: {
      documents: [] as { type: string; file: File; id: string }[],
    },

    D: {}, // empty object since Section D just completes the form
  });
  const [selectedType, setSelectedType] = useState("");
  const [emailError, setEmailError] = useState(""); // to catch email validation error's
  const [loading, setLoading] = useState(false); //loadind state for moving steps to steps
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>(
    [],
  );

  const router = useRouter(); // to redirect user when done.

  // Stage a document (add to pending list)
  const handleStageDocument = (type: string, file: File) => {
    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
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

    // Check if document type already exists in pending
    const existingPending = pendingDocuments.find((doc) => doc.type === type);
    if (existingPending) {
      toast.error(
        `"${type}" is already staged. Remove it first to add a new one.`,
      );
      return;
    }

    // Check if document type already exists in uploaded
    const existingUploaded = formData.C.documents.find(
      (doc: any) => doc.type === type,
    );
    if (existingUploaded) {
      toast.error(
        `"${type}" is already uploaded. Remove it first to add a new one.`,
      );
      return;
    }

    // Add to pending list with unique ID
    const newPendingDoc: PendingDocument = {
      type,
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setPendingDocuments((prev) => [...prev, newPendingDoc]);
    setSelectedType(""); // Reset dropdown
    toast.success(`"${type}" staged successfully!`);
  };

  // Remove a pending document
  const removePendingDocument = (id: string) => {
    setPendingDocuments((prev) => prev.filter((doc) => doc.id !== id));
    toast("Document removed from staging", { icon: "📂" });
  };

  // Upload all pending documents
  const uploadAllPendingDocuments = async (): Promise<boolean> => {
    if (pendingDocuments.length === 0) {
      return true; // No documents to upload
    }

    const schoolId = formData.school_id || localStorage.getItem("school_id");

    if (!schoolId) {
      toast.error("School ID is missing. Please complete Section A first.");
      return false;
    }

    let successCount = 0;
    let failCount = 0;
    const uploadedDocs: UploadedDocument[] = [];

    // Show loading toast
    const loadingToastId = toast.loading(
      `Uploading ${pendingDocuments.length} document(s)...`,
    );

    for (const pendingDoc of pendingDocuments) {
      const formDataToSend = new FormData();
      formDataToSend.append("file", pendingDoc.file);
      formDataToSend.append("type", pendingDoc.type);
      formDataToSend.append("school_id", String(schoolId));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formDataToSend,
        });

        const result = await res.json();

        if (result.success) {
          successCount++;
          uploadedDocs.push({
            type: pendingDoc.type,
            url: result.url,
            public_id: result.public_id,
          });
        } else {
          failCount++;
          console.error(`Failed to upload ${pendingDoc.type}:`, result.message);
        }
      } catch (err) {
        failCount++;
        console.error(`Error uploading ${pendingDoc.type}:`, err);
      }
    }

    // Dismiss loading toast
    toast.dismiss(loadingToastId);

    // Update form data with successfully uploaded documents
    if (uploadedDocs.length > 0) {
      setFormData((prev: any) => ({
        ...prev,
        C: {
          ...prev.C,
          documents: [...(prev.C.documents || []), ...uploadedDocs],
        },
      }));
    }

    // Clear pending documents
    setPendingDocuments([]);

    // Show result toast
    if (failCount === 0) {
      toast.success(`All ${successCount} document(s) uploaded successfully!`);
      return true;
    } else if (successCount > 0) {
      toast.error(
        `${successCount} succeeded, ${failCount} failed. Please retry failed uploads.`,
      );
      return false;
    } else {
      toast.error("All uploads failed. Please try again.");
      return false;
    }
  };

  const handleChange = <T extends keyof FormData>(
    section: T,
    field: keyof FormData[T],
    value: string,
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

  // Modified saveCurrentSection for Section D
  // Modified saveCurrentSection for Section D (Documents)
  const saveCurrentSection = async (
    autoProgress: boolean = false,
  ): Promise<boolean> => {
    setLoading(true);

    try {
      const sectionKey = Object.keys(formData)[currentStep];
      const sectionData = formData[sectionKey] || {};

      setEmailError("");

      // Email validation for Section A
      if (sectionKey === "A") {
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

      // ✅ Section C: Handle document uploads
      if (sectionKey === "C") {
        // Upload pending documents first if any exist
        if (pendingDocuments.length > 0) {
          const uploadSuccess = await uploadAllPendingDocuments();
          if (!uploadSuccess) {
            setLoading(false);
            return false;
          }
          // Wait a moment for state to update
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      // ✅ Section D: Mark form as complete
      if (sectionKey === "D") {
        if (!formData.school_id) {
          toast.error(
            "❗ Missing school ID. Please complete previous sections first.",
          );
          setLoading(false);
          return false;
        }

        const res = await fetch("/api/schools/newreg/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "D",
            school_id: formData.school_id || localStorage.getItem("school_id"),
          }),
        });

        const result = await res.json();

        if (!result.success) {
          console.error("Failed to complete registration:", result.message);
          toast.error(result.message || "Failed to complete registration");
          setLoading(false);
          return false;
        }

        toast.success("🎉 Registration completed successfully!");
        setLoading(false);

        // Redirect to success page or dashboard
        // setTimeout(() => {
        //   router.push("/registration-complete"); // or wherever you want
        // }, 1500);

        return true;
      }

      // Prepare data for saving (remove confirmemail if exists)
      const { confirmemail, ...sanitizedData } = sectionData;

      let endpoint = "/api/schools/newreg/create";
      let bodyData: Record<string, any> = {
        section: sectionKey,
        ...sanitizedData,
      };

      // For sections other than A, use update endpoint
      if (sectionKey !== "A" && sectionKey !== "D") {
        endpoint = "/api/schools/newreg/update";

        if (!formData.school_id) {
          toast.error("❗ Missing school ID. Please complete section A first.");
          setLoading(false);
          return false;
        }

        bodyData.school_id =
          formData.school_id || localStorage.getItem("school_id");
      }

      // Skip API call for Section C (documents handled separately)
      if (sectionKey === "C") {
        toast.success("Documents uploaded successfully");
        setLoading(false);

        if (autoProgress) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          nextStep();
        }

        return true;
      }

      // Save section to database
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

      // Store school_id from Section A
      if (sectionKey === "A" && result.school_id) {
        setFormData((prev) => ({ ...prev, school_id: result.school_id }));
        localStorage.setItem("school_id", result.school_id);
        console.log("🎯 Stored school_id:", result.school_id);
      }

      toast.success(`Section ${sectionKey} saved successfully`);
      setLoading(false);

      // Auto-progress to next section if requested
      if (autoProgress) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        nextStep();
      }

      return true;
    } catch (err) {
      console.error("Save error:", err);
      setEmailError("An unexpected error occurred.");
      toast.error("Something went wrong.");
      setLoading(false);
      return false;
    }
  };

  // Simplified handleProceed
  const handleProceed = async () => {
    const success = await saveCurrentSection(true);
    // nextStep() is now handled inside saveCurrentSection when autoProgress is true
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
                  required
                >
                  <option value="">Select LGA</option>
                  {GOMBE_LGAS.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:col-span-3">
                <h3 className="font-semibold mb-2">Category</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {SCHOOL_CATEGORIES.map((prog) => (
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
                  ))}
                </div>
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
                  type="number"
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
                      value={formData.B.contact_person}
                      onChange={(e) =>
                        handleChange("B", "contact_person", e.target.value)
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
                      value={formData.B.contact_person_designation}
                      onChange={(e) =>
                        handleChange(
                          "B",
                          "contact_person_designation",
                          e.target.value,
                        )
                      }
                      className="w-full p-2 border  border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      School Contact Person Phone
                    </label>
                    <input
                      type="number"
                      placeholder="Telephone Number"
                      value={formData.B.contact_person_phone}
                      pattern="[0-9]*" // Optional: basic validation pattern for numbers
                      onChange={(e) =>
                        handleChange(
                          "B",
                          "contact_person_phone",
                          e.target.value,
                        )
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
                      Select Document Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                {/* Pending Documents Preview (Multiple) */}
                {pendingDocuments.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          ⏳
                        </span>
                        Staged Documents ({pendingDocuments.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDocuments([]);
                          toast("All staged documents cleared", { icon: "📂" });
                        }}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Clear All
                      </button>
                    </div>

                    <ul className="space-y-2">
                      {pendingDocuments.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-start justify-between bg-white border border-yellow-200 rounded px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <FileUp
                              className="text-yellow-600 flex-shrink-0"
                              size={18}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.type}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {doc.file.name} •{" "}
                                {(doc.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePendingDocument(doc.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs text-yellow-700 mt-3 flex items-center gap-1">
                      <span>⚠️</span>
                      Click "Proceed" below to upload all{" "}
                      {pendingDocuments.length} staged document(s)
                    </p>
                  </div>
                )}

                {/* Uploaded Documents List */}
                {formData.C.documents.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs">
                        ✓
                      </span>
                      Uploaded Documents ({formData.C.documents.length})
                    </h3>
                    <ul className="space-y-2">
                      {formData.C.documents.map((doc: any, index: number) => (
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
                                    (_: any, i: number) => i !== index,
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
                {formData.C.documents.length === 0 &&
                  pendingDocuments.length === 0 && (
                    <p className="mt-4 text-sm text-gray-500 italic">
                      No documents uploaded yet. Please select and stage at
                      least one document.
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* Section C - Congratulations */}
          {currentStep === 3 && (
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
                    {/* <li>Review typically takes 1-2 days</li> */}
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
            {currentStep > 0 && currentStep < 3 ? (
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
