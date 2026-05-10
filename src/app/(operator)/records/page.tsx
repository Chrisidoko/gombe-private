"use client";

import { useState, useEffect } from "react";
import { Divider } from "@/components/Divider";
import { TransactionType } from "@/lib/types";

import { getColumns } from "@/components/ui/data-table/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
// import { ChevronsUpDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Row } from "@tanstack/react-table";
import Filterbar from "@/components/ui/datefilter";
// import { DataTableDrawer } from "@/components/ui/data-table/DataTableDrawer";

export type PeriodValue = "previous-period" | "last-year" | "no-comparison";

//Function to get start and end of the current month
const getStartAndEndOfMonth = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  // const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    perPage: 20,
    page: 1,
    startDate: "2025-12-01",
    endDate: "2026-12-31",
  });
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>(
    getStartAndEndOfMonth(),
  );

  const handleDatesChange = (dates: DateRange | undefined) => {
    if (!dates?.from || !dates?.to) return;

    const fmt = (d: Date) => d.toISOString().split("T")[0]; // "YYYY-MM-DD"

    setSelectedDates(dates);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      startDate: fmt(dates.from!),
      endDate: fmt(dates.to!),
    }));
  };

  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodValue>("last-year");

  //data drawer
  // const [selectedRow, setSelectedRow] = useState<TransactionType | undefined>(
  //   undefined
  // );
  // const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: Row<TransactionType>) => {
    // setSelectedRow(row.original);
    // setDrawerOpen(true);
  };
  const columns = getColumns({ onRowClick: handleRowClick });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { perPage, page, startDate, endDate } = filters;
      const res = await fetch(
        `/api/transactions/all?per_page=${perPage}&page=${page}&start_date=${startDate}&end_date=${endDate}`,
      );
      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions);
        // setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-[#687799] leading-6 text-sm">
            Showing your transactions for the{" "}
            <span className="font-semibold">current month.</span> To see
            transactions from a different time period, please choose a new
            <span className="font-semibold"> date range</span>.
          </p>
        </div>
      </div>
      <Divider />

      {/*Banner*/}
      <>
        <div className="text-sm mt-6 sm:flex sm:items-start sm:space-x-6">
          <div className="flex flex-col justify-between py-1 pl-4 ">
            <div className="mt-4 sm:mt-0">
              <div className="mt-0 flex items-center space-x-5">
                <Filterbar
                  maxDate={new Date()} // Prevent future dates
                  minDate={new Date(2025, 11, 1)}
                  selectedDates={selectedDates}
                  onDatesChange={handleDatesChange}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
                {/* {sumTnx !== null && (
                  <div className="flex items-center gap-2 text-[#151D48] font-semibold text-md">
                    <span className="text-indigo-500 ">Total Revenue:</span>
                    <span className="font-bold text-lg">
                      {sumTnx.toLocaleString()}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </div>
      </>

      <div>
        {/* Your UI here */}
        {loading ? (
          <div className="w-full mt-8 flex items-center justify-center">
            <span className="bg-[#E6EEFF] py-[4px] px-[13px] text-[#0055FF] rounded-full">
              Fetching
            </span>
          </div>
        ) : (
          <>
            <div className="bg-[#ffffff] px-6 py-6 sm:mt-6 lg:mt-10 border-2 border-[#F8F9FA] shadow-[0_4px_20px_rgba(238,238,238,0.302)] rounded-[10px] ">
              <DataTable data={transactions} columns={columns} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
