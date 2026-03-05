"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Download,
  Loader2,
  MapPin,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";

type Questionnaire = {
  id: number;
  school_id: string;
  school_name: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
  lga: string;
  state: string;
  doc_approval?: string;
};

export default function QuestionnairePage() {
  const [documents, setDocuments] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch("/api/schools/questionnaires");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setDocuments(data);
      } catch {
        setError("Could not load questionnaires.");
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const filtered = documents.filter(
    (d) =>
      d.school_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.school_id?.toLowerCase().includes(search.toLowerCase()) ||
      d.lga?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleApprove(school_id: string) {
    setApproving(school_id);
    try {
      const res = await fetch("/api/schools/questionnaires", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id }),
      });

      if (!res.ok) throw new Error("Approval failed");

      // Update local state so UI reflects immediately
      setDocuments((prev) =>
        prev.map((d) =>
          d.school_id === school_id ? { ...d, doc_approval: "approved" } : d,
        ),
      );
      toast.success("Document approved successfully");
    } catch {
      toast.error("Failed to approve document");
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
            <p className="text-sm text-gray-500">
              | Manage Uploaded Questionnaires. Download, Review, and Accept
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {documents.length} questionnaire{documents.length !== 1 ? "s" : ""}{" "}
            submitted
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by school name, ID or LGA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-sm text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-sm text-gray-400">
            No questionnaires found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400">
              <div className="col-span-5">Institution</div>
              {/* <div className="col-span-3">School ID</div> */}
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Uploaded</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* School name */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100 shrink-0">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {doc.school_name || "—"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">
                          {doc.document_type}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* School ID */}
                  {/* <div className="col-span-3">
                    <p className="text-xs font-mono text-gray-600">
                      {doc.school_id}
                    </p>
                  </div> */}

                  {/* Location */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500 truncate">
                        {doc.lga || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Uploaded at */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500">
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Action */}

                  <div className="col-span-3 flex justify-end items-center gap-3">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>

                    {doc.doc_approval === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApprove(doc.school_id)}
                        disabled={approving === doc.school_id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approving === doc.school_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
