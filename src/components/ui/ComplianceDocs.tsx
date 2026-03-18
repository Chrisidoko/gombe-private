"use client";

import { useState } from "react";
import { Download, FileText, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Doc = {
  id: string;
  name: string;
  description: string;
  available: boolean;
  lockedMessage?: string;
};

export default function ComplianceDocs({
  school_id,
  license_status,
  license_number,
}: {
  school_id: string;
  license_status?: string;
  license_number?: string;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const hasActiveLicense = license_status === "Active" && !!license_number;

  // ── Define available documents — add more here as they become available
  const documents: Doc[] = [
    {
      id: "consent_certificate",
      name: "Consent Certificate",
      description:
        "Official certificate of consent issued by the Ministry of Education.",
      available: hasActiveLicense,
      lockedMessage:
        "Available once your certificate fee is paid and license is activated.",
    },
    // ── Add future docs here e.g:
    // {
    //   id:          "establishment_certificate",
    //   name:        "Establishment Certificate",
    //   description: "Certificate of establishment for your institution.",
    //   available:   false,
    //   lockedMessage: "Coming soon.",
    // },
  ];

  async function handleDownload(docId: string) {
    if (docId === "consent_certificate") {
      setDownloading(docId);
      try {
        const res = await fetch("/api/generate-license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ school_id }),
        });

        if (!res.ok) throw new Error("Failed to generate certificate");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Certificate-${license_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Certificate downloaded successfully");
      } catch {
        toast.error("Failed to download certificate");
      } finally {
        setDownloading(null);
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-6 py-5">
        <h3 className="text-sm font-bold text-white">Compliance Documents</h3>
        <p className="text-xs text-green-300 mt-0.5">
          Download your official documents from the Ministry of Education
        </p>
      </div>

      {/* Document list */}
      <div className="divide-y divide-gray-100">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between px-6 py-4 gap-4"
          >
            {/* Left */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                  doc.available ? "bg-green-50" : "bg-gray-100"
                }`}
              >
                <FileText
                  className={`w-4 h-4 ${
                    doc.available ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {doc.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {doc.available ? doc.description : doc.lockedMessage}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="shrink-0">
              {doc.available ? (
                <button
                  onClick={() => handleDownload(doc.id)}
                  disabled={downloading === doc.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {downloading === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {downloading === doc.id ? "Generating..." : "Download"}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <Lock className="w-3.5 h-3.5" />
                  Locked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
