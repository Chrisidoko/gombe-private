import { getUserFromCookie } from "@/lib/auth";
import { Divider } from "@/components/Divider";
import AssesmentForm from "@/components/ui/assementform";

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
    { cache: "no-store" }
  );
  const { status } = await res.json();

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row ">
        <div className="sm:w-1/3 w-full">
          <h1 className="text-2xl  font-semibold text-gray-900">
            Self Assessment
          </h1>
          <p className="text-gray-500 sm:text-sm/6">
            Please enter assessment details of your institution
          </p>
        </div>
        {status === "pending" ? (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center font-semibold">
            Waiting for approval. You cannot refill this form at the moment.
          </div>
        ) : (
          <AssesmentForm />
        )}
      </div>
      <Divider />
      {/* events grid */}
    </main>
  );
}
