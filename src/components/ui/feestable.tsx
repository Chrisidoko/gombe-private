"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/formatDate";
import Link from "next/link";

interface invoiceTypes {
  id: number;
  school_id: string;
  invoice_number: string;
  amount: string | number;
  issue_date: string;
  due_date: string;
  status: string;
}

export default function FeesTable({ schoolId }: { schoolId: string }) {
  const [invoices, setInvoices] = useState<invoiceTypes[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Invoices</h2>

      {invoices.length === 0 ? (
        <p className="text-gray-500">No invoices found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-sm">
              <th className="p-2 text-left">Invoice #</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Issue Date</th>
              <th className="p-2 text-left">Due Date</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b text-sm">
                <td className="p-2">{inv.invoice_number}</td>
                <td className="p-2">₦{Number(inv.amount).toLocaleString()}</td>
                <td className="p-2">{formatDate(inv.issue_date)}</td>
                <td className="p-2">{formatDate(inv.due_date)}</td>
                <td
                  className={`p-2 font-semibold ${
                    inv.status === "unpaid" ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {inv.status.toUpperCase()}
                </td>
                <td className="p-2">
                  {inv.status === "unpaid" ? (
                    <Link
                      href={`/checkout?school_id=${schoolId}&ref=${encodeURIComponent(
                        inv.invoice_number
                      )}&amount=${inv.amount}&item=Tax Invoice`}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    >
                      Pay Now
                    </Link>
                  ) : (
                    <span className="text-gray-400">Paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
