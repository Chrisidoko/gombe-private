import { Divider } from "@/components/Divider";

export default function Transactions() {
  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-500 sm:text-sm/6">Transactions History</p>
        </div>
      </div>
      <Divider />
      {/* events grid */}
    </main>
  );
}
