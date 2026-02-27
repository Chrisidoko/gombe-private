import { Suspense } from "react";
import VerifyForm from "./verifyclient";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={<div>Please wait while loading verification form...</div>}
    >
      <VerifyForm />
    </Suspense>
  );
}
