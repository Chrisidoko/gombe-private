"use client";

import { useEffect, useState } from "react";
import {
  // Layers,
  X,
  ExternalLink,
} from "lucide-react";

import * as XLSX from "xlsx";

interface TransactionType {
  id: number;
  reference: string;
  amount: string | number;
  status: string;
  payment_item: string;
  invoice_number: string | null;
  updated_at: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700 border-green-200";
    case "unpaid":
      return "bg-red-100 text-red-700 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "unpaid":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "pending":
      return (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function TransactionsTable({ schoolId }: { schoolId: string }) {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "Unpaid" | "pending">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!schoolId) return;

    async function fetchTransactions() {
      try {
        // Simulating API call - replace with actual API call
        // setTimeout(() => {
        //   setTransactions(mockTransactions);
        //   setLoading(false);
        // }, 800);

        // Actual API call
        const res = await fetch(`/api/transactions/${schoolId}`);
        const data = await res.json();
        setTransactions(data.invoices || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [schoolId]);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesFilter =
      filter === "all" || txn.status.toLowerCase() === filter;
    const matchesSearch =
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.payment_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.invoice_number &&
        txn.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // const stats = {
  //   total: transactions.reduce((sum, txn) => sum + Number(txn.amount), 0),
  //   success: transactions
  //     .filter((t) => t.status === "Paid")
  //     .reduce((sum, txn) => sum + Number(txn.amount), 0),
  //   failed: transactions.filter((t) => t.status === "Unpaid").length,
  //   pending: transactions.filter((t) => t.status === "pending").length,
  // };

  const exportToExcel = () => {
    const exportData = filteredTransactions.map((txn) => ({
      "Transaction ID": txn.id,
      Reference: txn.reference,
      "Amount (₦)": Number(txn.amount).toLocaleString(),
      Status: txn.status.toUpperCase(),
      "Payment Item": txn.payment_item,
      "Invoice Number": txn.invoice_number || "N/A",
      "Date & Time": formatDate(txn.updated_at),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Auto-size columns
    const maxWidth = 20;
    const wscols = Object.keys(exportData[0] || {}).map(() => ({
      wch: maxWidth,
    }));
    ws["!cols"] = wscols;

    XLSX.writeFile(
      wb,
      `transactions_${schoolId}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="px-6 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Transaction History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete record of all payment transactions
            </p>
          </div>

          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-all shadow-sm hover:shadow-md border border-gray-200"
          >
            <svg
              className="w-5 h-5 text-green-600"
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
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-3">
        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by reference, or payment item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "paid", "Unpaid", "pending"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === status
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/30 bg-opacity-30">
                    {status === "all"
                      ? transactions.length
                      : transactions.filter((t) => t.status === status).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500 font-medium">
                No transactions found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tx Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Item
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoice
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {txn.reference}
                          </p>
                          {/* <p className="text-xs text-gray-500">ID: {txn.id}</p> */}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-base font-bold text-gray-900">
                        ₦{Number(txn.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">
                        {txn.payment_item}
                      </p>
                    </td>
                    {/* <td className="px-6 py-4">
                      {txn.invoice_number ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {txn.invoice_number}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td> */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          txn.status,
                        )}`}
                      >
                        {getStatusIcon(txn.status)}
                        {txn.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(txn.updated_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {txn.reference ? (
                        <button
                          onClick={() =>
                            setReceiptUrl(
                              `https://paykaduna.com/payment_summary_open?billReference=${txn.reference}&ref=${txn.reference}`,
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </button>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Receipt Modal */}
        {receiptUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setReceiptUrl(null)}
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden"
              style={{ height: "85vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">
                  Payment Receipt
                </p>
                <button
                  onClick={() => setReceiptUrl(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* iframe */}
              <iframe
                src={receiptUrl}
                className="w-full h-full border-0"
                title="Payment Receipt"
              />
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {filteredTransactions.length}
                </span>{" "}
                transactions
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
