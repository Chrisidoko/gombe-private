"use client";

import { useState } from "react";

interface PDFPreviewProps {
  schoolId: string;
  schoolName: string;
  licenseNumber?: string;
}

export default function PDFPreviewComponent({
  schoolId,
  schoolName,
  licenseNumber,
}: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_id: schoolId,
          school_name: schoolName,
          license_number: licenseNumber || `LIC-${Date.now()}`,
          issue_date: new Date().toLocaleDateString(),
          expiry_date: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toLocaleDateString(),
          invoice_number: "PREVIEW",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `license-${licenseNumber || schoolId}.pdf`;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={generatePreview}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <span>Preview License</span>
          )}
        </button>

        {pdfUrl && (
          <button
            onClick={downloadPDF}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {pdfUrl && (
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-96"
            title="License Preview"
          />
        </div>
      )}
    </div>
  );
}
