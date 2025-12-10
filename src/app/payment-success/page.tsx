import Link from "next/link";
import Image from "next/image";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Successful!
          </h1>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Additional Info */}
          <div className="text-sm text-gray-500 mb-8">
            <p>
              Thank you for your payment. Your transaction has been completed
              successfully.
            </p>
          </div>

          {/* Action Button */}
          <Link
            href="/home"
            className="inline-block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Return to Dashboard
          </Link>

          {/* Support Link */}
          <p className="mt-6 text-sm text-gray-500">
            Need help?{" "}
            <a
              href="mailto:support@paypro-solutions.com"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center text-center text-sm text-gray-500 mt-12">
          Powered by{" "}
          <span className="px-1">
            <Image src="/paypro.png" alt="Logo" width={46} height={46} />
          </span>
          © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
