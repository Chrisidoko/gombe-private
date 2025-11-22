"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { FileText } from "lucide-react";

interface invoiceTypes {
  id: number;
  school_id: string;
  invoice_number: string;
  amount: string | number;
  issue_date: string;
  due_date: string;
  status: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysUntilDue(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function FeesTable({ schoolId }: { schoolId: string }) {
  const [invoices, setInvoices] = useState<invoiceTypes[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    if (!schoolId) return;

    async function fetchInvoices() {
      try {
        const res = await fetch(`/api/invoices/${schoolId}`);
        const data = await res.json();
        setInvoices(data.invoices || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [schoolId]);

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === "all") return true;
    return inv.status === filter;
  });

  const totalUnpaid = invoices
    .filter((inv) => inv.status === "unpaid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-50 rounded"></div>
            <div className="h-16 bg-gray-50 rounded"></div>
            <div className="h-16 bg-gray-50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // return (
  //   <div className="bg-white p-6 rounded-xl shadow-md">
  //     <h2 className="text-xl font-semibold mb-4">Invoices</h2>

  //     {invoices.length === 0 ? (
  //       <p className="text-gray-500">No invoices found.</p>
  //     ) : (
  //       <table className="w-full border-collapse">
  //         <thead>
  //           <tr className="bg-gray-100 text-sm">
  //             <th className="p-2 text-left">Invoice #</th>
  //             <th className="p-2 text-left">Amount</th>
  //             <th className="p-2 text-left">Issue Date</th>
  //             <th className="p-2 text-left">Due Date</th>
  //             <th className="p-2 text-left">Status</th>
  //             <th className="p-2 text-left">Action</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {invoices.map((inv) => (
  //             <tr key={inv.id} className="border-b text-sm">
  //               <td className="p-2">{inv.invoice_number}</td>
  //               <td className="p-2">₦{Number(inv.amount).toLocaleString()}</td>
  //               <td className="p-2">{formatDate(inv.issue_date)}</td>
  //               <td className="p-2">{formatDate(inv.due_date)}</td>
  //               <td
  //                 className={`p-2 font-semibold ${
  //                   inv.status === "unpaid" ? "text-red-500" : "text-green-600"
  //                 }`}
  //               >
  //                 {inv.status.toUpperCase()}
  //               </td>
  //               <td className="p-2">
  //                 {inv.status === "unpaid" ? (
  //                   <Link
  //                     href={`/checkout?school_id=${schoolId}&ref=${encodeURIComponent(
  //                       inv.invoice_number
  //                     )}&amount=${inv.amount}&item=Tax Invoice`}
  //                     className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
  //                   >
  //                     Pay Now
  //                   </Link>
  //                 ) : (
  //                   <span className="text-gray-400">Paid</span>
  //                 )}
  //               </td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     )}
  //   </div>
  // );

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track your school invoices
            </p>
          </div>

          {totalUnpaid > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-xs text-red-600 font-medium">
                Outstanding Balance
              </p>
              <p className="text-xl font-bold text-red-700">
                ₦{totalUnpaid.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-2">
            {(["all", "unpaid", "paid"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  filter === status
                    ? "bg-white text-green-600 border-t-2 border-x border-green-600 -mb-px"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                    {invoices.filter((inv) => inv.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
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
                No invoices found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                There are no {filter !== "all" ? filter : ""} invoices to
                display
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv) => {
                    const daysUntilDue = getDaysUntilDue(inv.due_date);
                    const isOverdue =
                      daysUntilDue < 0 && inv.status === "unpaid";
                    const isDueSoon =
                      daysUntilDue <= 7 &&
                      daysUntilDue >= 0 &&
                      inv.status === "unpaid";

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 text-blue-500 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText size={21} />
                            </div>
                            <div>
                              <p className="font-base text-gray-900">
                                {inv.invoice_number}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {inv.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="font-semibold text-gray-900">
                            ₦{Number(inv.amount).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-700">
                            {formatDate(inv.issue_date)}
                          </p>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-sm text-gray-700">
                              {formatDate(inv.due_date)}
                            </p>
                            {isOverdue && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                Overdue by {Math.abs(daysUntilDue)} days
                              </p>
                            )}
                            {isDueSoon && (
                              <p className="text-xs text-orange-600 font-medium mt-1">
                                Due in {daysUntilDue} days
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              inv.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : isOverdue
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {inv.status === "paid" && (
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4">
                          {inv.status === "unpaid" ? (
                            <Link
                              href={`/checkout?school_id=${schoolId}&ref=${encodeURIComponent(
                                inv.invoice_number
                              )}&amount=${inv.amount}&item=Tax Invoice`}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                            >
                              Pay Now
                            </Link>
                          ) : (
                            // <button
                            //   onClick={() =>
                            //     alert(
                            //       `Redirecting to payment for ${inv.invoice_number}`
                            //     )
                            //   }
                            //   className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                            // >
                            //   Pay Now
                            // </button>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Paid
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">{filteredInvoices.length}</span>{" "}
                of <span className="font-semibold">{invoices.length}</span>{" "}
                invoices
              </p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Paid: </span>
                  <span className="font-bold text-green-700">
                    ₦
                    {invoices
                      .filter((inv) => inv.status === "paid")
                      .reduce((sum, inv) => sum + Number(inv.amount), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Unpaid: </span>
                  <span className="font-bold text-red-700">
                    ₦{totalUnpaid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
