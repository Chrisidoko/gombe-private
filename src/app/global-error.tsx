"use client";

// Last resort, for an error in the root layout itself. It replaces the root
// layout, so it brings its own <html> and <body> and the global styles.
import { useEffect } from "react";
import "./globals.css";
import ErrorScreen from "@/components/ErrorScreen";

export default function GlobalError({
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
    <html lang="en">
      <body className="antialiased">
        <ErrorScreen
          title="Something went wrong"
          message="The portal couldn't be loaded. Please try again. If it keeps happening, contact support with the reference below."
          digest={error.digest}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
