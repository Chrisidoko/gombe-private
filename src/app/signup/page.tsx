// src/app/signup/page.tsx
"use client";

import { Suspense } from "react";
import SignUpForm from "./SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading signup…</div>}>
      <SignUpForm />
    </Suspense>
  );
}
