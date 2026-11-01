// Public check for the QR code on a printed notice. Confirms the notice is real
// and whose it is, and deliberately shows no amounts.
import { CheckCircle2, XCircle } from "lucide-react";
import pool from "@/lib/db";

export default async function VerifyNoticePage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number } = await searchParams;

  const { rows } = number
    ? await pool.query(
        `SELECT n.notice_number, n.year, n.issued_at, s.name
         FROM annual_notices n
         LEFT JOIN schoolskano s ON s.school_id = n.school_id
         WHERE n.notice_number = $1 AND n.status = 'issued'`,
        [number],
      )
    : { rows: [] };
  const notice = rows[0];

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md text-center">
        {notice ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
            <h1 className="text-lg font-bold text-gray-900 mt-3">
              Genuine Single Demand Notice
            </h1>
            <dl className="text-sm text-gray-600 mt-4 space-y-1">
              <div>{notice.notice_number}</div>
              <div className="font-semibold text-gray-800">{notice.name}</div>
              <div>
                {notice.year} notice, issued{" "}
                {new Date(notice.issued_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </dl>
          </>
        ) : (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h1 className="text-lg font-bold text-gray-900 mt-3">
              Notice not found
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              This notice number doesn&apos;t match an issued notice.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
