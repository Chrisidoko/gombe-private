import dynamic from "next/dynamic";
// import { Suspense } from "react";

const CheckoutContent = dynamic(() => import("./CheckoutContent"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function CheckoutPage() {
  return <CheckoutContent />;
}
