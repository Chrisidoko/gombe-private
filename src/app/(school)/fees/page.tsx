import { Divider } from "@/components/Divider";

export default function HomeDashboard() {
  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fees</h1>
          <p className="text-gray-500 sm:text-sm/6">
            Demands Notices, Fines, Fees & Penalties
          </p>
        </div>
      </div>
      <Divider />
      {/* events grid */}
    </main>
  );
}
