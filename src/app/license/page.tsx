// app/license/page.tsx (Server Component)
import { Suspense } from "react";
import pool from "@/lib/db";
import CheckoutClient from "./LicenseClient";

interface PageProps {
  searchParams: Promise<{
    id?: string;
    ref?: string;
    school_id?: string;
    item?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  // Await searchParams
  const params = await searchParams;
  const { ref, school_id, item } = params;

  // Validate required params
  if (!school_id || !ref) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-semibold mb-2">Invalid Request</h2>
            <p className="text-gray-600">Missing required parameters</p>
          </div>
        </div>
      </div>
    );
  }

  try {
    // Fetch school info from database
    const { rows: schoolRows } = await pool.query(
      "SELECT school_id, name, email, tin FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (schoolRows.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
            <div className="text-red-600 text-center">
              <h2 className="text-xl font-semibold mb-2">School Not Found</h2>
              <p className="text-gray-600">Invalid school ID</p>
            </div>
          </div>
        </div>
      );
    }

    const school = schoolRows[0];

    // Fetch invoice details from database
    const { rows: invoiceRows } = await pool.query(
      `SELECT id, invoice_number, school_id, amount, status, bill_reference 
       FROM schoolkano_invoices 
       WHERE invoice_number = $1 AND school_id = $2`,
      [ref, school_id],
    );

    if (invoiceRows.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
            <div className="text-red-600 text-center">
              <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
              <p className="text-gray-600">Invalid invoice number</p>
            </div>
          </div>
        </div>
      );
    }

    const invoice = invoiceRows[0];

    // Prepare data for client component
    const invoiceData = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      school_id: invoice.school_id,
      school_name: school.name,
      school_email: school.email,
      item: item || "License Renewal",
      amount: parseFloat(invoice.amount),
      status: invoice.status,
      bill_reference: invoice.bill_reference,
    };

    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading checkout...</p>
            </div>
          </div>
        }
      >
        <CheckoutClient invoiceData={invoiceData} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading checkout page:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600">Failed to load checkout information</p>
          </div>
        </div>
      </div>
    );
  }
}
