"use client";

// Shown in place of Next.js's default error and 404 pages. In production
// Next.js hides the real error message from the browser and gives a digest
// instead, which matches the entry in the server logs, so that's what the
// user is shown to quote to support.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function ErrorScreen({
  title,
  message,
  digest,
  onRetry,
  fullPage = true,
}: {
  title: string;
  message: string;
  digest?: string;
  onRetry?: () => void;
  // false inside a role's layout, where the sidebar is still showing
  fullPage?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      className={`flex items-center justify-center px-4 ${
        fullPage ? "min-h-screen bg-gray-50" : "py-24"
      }`}
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gombe_logo.png"
          alt="Gombe State logo"
          className="w-14 h-14 mx-auto object-contain"
        />
        <h1 className="mt-5 text-lg font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        {digest && (
          <p className="mt-4 text-xs text-gray-400">
            Reference: <span className="font-mono">{digest}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
        {fullPage && (
          <Link
            href="/"
            className="mt-4 inline-block text-xs font-semibold text-green-700 hover:text-green-800"
          >
            Go to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
