"use client";

// Errors on this role's pages, shown inside its layout so the sidebar stays.
import { useEffect } from "react";
import ErrorScreen from "@/components/ErrorScreen";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      title="Something went wrong"
      message="This page couldn't be loaded. Please try again. If it keeps happening, contact support with the reference below."
      digest={error.digest}
      onRetry={reset}
      fullPage={false}
    />
  );
}
