"use client";

import { useState } from "react";
import { FileUp, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

type DocumentItem = { type: string; url: string; public_id?: string };

type FormData = {
  license_number: string;
  license_expiry_date: string;
  last_license_renewal: string;
  documents: DocumentItem[];
};

interface LicenseModalProps {
  schoolId: string;
  onComplete?: () => void; // called after successful save so parent can re-fetch
}

export default function LicenseModal({
  schoolId,
  onComplete,
}: LicenseModalProps) {
  const [formData, setFormData] = useState<FormData>({
    license_number: "",
    license_expiry_date: "",
    last_license_renewal: "",
    documents: [],
  });

  const [selectedType, setSelectedType] = useState("");
  const [pendingDocument, setPendingDocument] = useState<{
    type: string;
    file: File;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleStageDocument(type: string, file: File) {
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize)
      return toast.error("File size must be less than 2MB");

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type))
      return toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");

    setPendingDocument({ type, file });
    toast.success("Document selected. Click 'Submit' to upload and save.");
  }

  async function uploadPendingDocument(): Promise<string | null> {
    if (!pendingDocument) return null;

    const payload = new FormData();
    payload.append("file", pendingDocument.file);
    payload.append("type", pendingDocument.type);
    payload.append("school_id", String(schoolId));

    const res = await fetch("/api/upload", { method: "POST", body: payload });
    const result = await res.json();

    if (!result.success) throw new Error(result.message || "Upload failed");

    return result.url;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!formData.license_number.trim())
      return toast.error("License number is required.");
    if (!formData.license_expiry_date)
      return toast.error("License expiry date is required.");
    if (!formData.last_license_renewal)
      return toast.error("Last license renewal date is required.");
    if (!pendingDocument && formData.documents.length === 0)
      return toast.error("Please upload your State Issued License document.");

    setLoading(true);
    try {
      // 1. Upload document if pending
      let uploadedUrl = "";
      if (pendingDocument) {
        toast.loading("Uploading document...");
        uploadedUrl = (await uploadPendingDocument()) ?? "";
        toast.dismiss();
        toast.success("Document uploaded!");

        setFormData((prev) => ({
          ...prev,
          documents: [
            ...prev.documents,
            { type: pendingDocument.type, url: uploadedUrl },
          ],
        }));
        setPendingDocument(null);
      }

      // 2. Save license info to DB
      const res = await fetch("/api/schools/licenseinfo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: schoolId,
          license_number: formData.license_number,
          license_expiry_date: formData.license_expiry_date,
          last_license_renewal: formData.last_license_renewal,
          //   document_url: uploadedUrl || formData.documents[0]?.url,
        }),
      });

      if (!res.ok) throw new Error("Failed to save license information.");

      setDone(true);
      onComplete?.();
    } catch (err) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Certificate Saved!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your certificate information has been recorded successfully.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Main Modal ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Certificate Information Required
              </h2>
              <p className="text-xs text-gray-400">
                Please provide your institution&apos;s consent certificate
                details to continue
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Certificate Number + Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Certificate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="School Certificate Number"
                value={formData.license_number}
                onChange={(e) => handleChange("license_number", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Certificate Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.last_license_renewal}
                onChange={(e) =>
                  handleChange("last_license_renewal", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Certificate Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.license_expiry_date}
                onChange={(e) =>
                  handleChange("license_expiry_date", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Upload Consent Certificate
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document type select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Document Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select a document type --</option>
                  <option value="State Issued License">
                    State Issued Consent Certificate
                  </option>
                </select>
              </div>

              {/* File input */}
              {selectedType && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FileUp size={16} /> Select Document File
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleStageDocument(selectedType, file);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">
                    Max 2MB • PDF, JPG, PNG
                  </p>
                </div>
              )}
            </div>

            {/* Pending document preview */}
            {pendingDocument && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
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
                      toast("Document selection cleared", { icon: "📂" });
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  ⚠️ Click &apos;Submit&apos; below to upload this document
                </p>
              </div>
            )}

            {/* Uploaded documents list */}
            {formData.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs">
                    ✓
                  </span>
                  Uploaded Documents ({formData.documents.length})
                </h4>
                <ul className="space-y-2">
                  {formData.documents.map((doc, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-green-50 border border-green-300 rounded-lg px-3 py-2"
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-2"
                      >
                        <FileUp size={14} /> {doc.type}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            documents: prev.documents.filter(
                              (_, i) => i !== index,
                            ),
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

            {/* Empty state */}
            {formData.documents.length === 0 && !pendingDocument && (
              <p className="text-sm text-gray-500 italic">
                No documents uploaded yet. Please select and upload at least one
                document.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl px-6 pb-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Submit Certificate Information"}
          </button>
        </div>
      </div>
    </div>
  );
}
