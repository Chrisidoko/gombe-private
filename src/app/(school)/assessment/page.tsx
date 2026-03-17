import { getUserFromCookie } from "@/lib/auth";
import { Divider } from "@/components/Divider";
import AssesmentForm from "@/components/ui/assementform";
import { LockKeyhole } from "lucide-react";

export default async function AssesmentDashboard() {
  // retrieve school_id from user details or JWT
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-600 font-semibold">
        Error: Missing school ID.
      </div>
    );
  }

  //Fetch latest assessment status for school to know if user can fill the form or not
  // and if school already may has a pending assessment

  // ✅ Use an absolute base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/assessment/status?school_id=${user.institution}`,
    { cache: "no-store" },
  );
  const { status } = await res.json();

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 z-50 backdrop-blur-sm bg-white/60 flex items-center justify-center pointer-events-auto">
        <div className="mx-4 max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-lg px-8 py-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 mx-auto mb-4">
            <span className="text-2xl">
              <LockKeyhole />
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-2">
            Assessments Currently Unavailable
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            A formal notification will be made available to proceed with
            assessments.
          </p>
        </div>
      </div>

      {/* Page content — blurred and unclickable beneath overlay */}
      <main className="pointer-events-none select-none">
        <div className="flex flex-col gap-12 items-center">
          {status === "pending" ? (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center font-semibold">
              Waiting for approval. You cannot refill this form at the moment.
            </div>
          ) : (
            <AssesmentForm />
          )}
        </div>
        <Divider />
      </main>
    </div>
  );
}
