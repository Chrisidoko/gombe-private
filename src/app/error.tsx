"use client";

// Catches errors on any page that isn't inside a role's layout (sign in,
// registration, verification pages and so on).
import { useEffect } from "react";
import ErrorScreen from "@/components/ErrorScreen";

export default function AppError({
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
    />
  );
}
