// app/checkout/page.tsx
import React, { Suspense } from "react";
import CheckoutForm from "./CheckoutForm";

type SearchParams = {
  name?: string;
  email?: string;
  tin?: string;
  item?: string;
  amount?: string;
};

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  // Pass server-parsed searchParams into the client form as plain props.
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={<div className="p-8 text-center">Loading checkout…</div>}
      >
        <CheckoutForm
          name={searchParams.name ?? ""}
          email={searchParams.email ?? ""}
          tin={searchParams.tin ?? ""}
          item={searchParams.item ?? ""}
          amount={searchParams.amount ?? ""}
        />
      </Suspense>
    </div>
  );
}
