// app/checkout/page.tsx
import React, { Suspense } from "react";
import CheckoutForm from "./CheckoutForm";
import pool from "@/lib/db";

type SearchParams = {
  name?: string;
  email?: string;
  school_id?: string; // changed from tin
  tin?: string;
  ref?: string;
  item?: string;
  amount?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Pass server-parsed searchParams into the client form as plain props.

  const params = await searchParams; // ✅ await it first
  const { school_id, ref, item } = params;

  // ✅ Fetch school info from your DB
  const { rows } = await pool.query(
    "SELECT name, email, tin FROM schoolskano WHERE school_id = $1",
    [school_id]
  );

  // ✅ Fetch invoice request details
  const { rows: invoiceRows } = await pool.query(
    "SELECT amount FROM schoolkano_invoices WHERE invoice_number = $1 AND school_id = $2",
    [ref, school_id]
  );

  const school = rows[0] || {};
  const invoice = invoiceRows[0];

  if (!invoice) {
    return <div>Invalid payment reference. Please contact support.</div>;
  }

  return (
    <div className="min-h-screen">
      <Suspense
        fallback={<div className="p-8 text-center">Loading checkout…</div>}
      >
        <CheckoutForm
          name={school.name ?? ""}
          email={school.email ?? ""}
          tin={school.tin ?? ""}
          refId={ref ?? ""}
          item={item ?? ""}
          amount={invoice.amount ?? ""}
        />
      </Suspense>
    </div>
  );
}
