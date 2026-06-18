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
    startDate: "2025-10-01",
    endDate: "2026-12-31",
    lga: "",
  });
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>(
    getStartAndEndOfMonth(),
  );

  const handleDatesChange = (dates: DateRange | undefined) => {
    console.log("Raw selected dates:", dates);

    if (!dates?.from || !dates.to) return; // Ensure both are selected

    const fixedFrom = new Date(
      dates.from.getFullYear(),
      dates.from.getMonth(),
      dates.from.getDate(),
    );
    const fixedTo = new Date(
      dates.to.getFullYear(),
      dates.to.getMonth(),
      dates.to.getDate(),
    );

    // console.log("Adjusted Dates:", { fixedFrom, fixedTo });

    setSelectedDates({ from: fixedFrom, to: fixedTo });
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
      const { perPage, page, startDate, endDate, lga } = filters;
      const params = new URLSearchParams({
        per_page: String(perPage),
        page: String(page),
        start_date: startDate,
        end_date: endDate,
      });
      if (lga) params.set("lga", lga);
      const res = await fetch(`/api/transactions/all?${params.toString()}`);
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
          {/* <p className="text-gray-500 sm:text-sm/6">Transactions History</p> */}
          <p className="mt-2 text-gray-500 leading-6 text-sm">
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
          <div className="flex flex-col justify-between border-l-4 border-indigo-300  py-1 pl-4 ">
            <div className="mt-4 sm:mt-0">
              {/* <p className="mt-2 text-[#687799] leading-6 text-tremor-content">
                Showing your transactions for the{" "}
                <span className="font-semibold">current month.</span> To see
                transactions from a different time period, please choose a new
                <span className="font-semibold"> date range</span>.
              </p> */}
              <div className="mt-0 flex items-center flex-wrap gap-3">
                <Filterbar
                  maxDate={new Date()} // Prevent future dates
                  minDate={new Date(2024, 0, 1)}
                  selectedDates={selectedDates}
                  onDatesChange={handleDatesChange}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
                <select
                  value={filters.lga}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, lga: e.target.value, page: 1 }))
                  }
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All LGAs</option>
                  {[
                    "Birnin Gwari","Chikun","Giwa","Igabi","Ikara","Jaba",
                    "Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko",
                    "Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi",
                    "Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria",
                  ]
                    .sort()
                    .map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                </select>
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

            {/* Pagination */}
            {/* {pagination && (
            <div>
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </button>
              <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </button>
            </div>
          )} */}
          </>
        )}
      </div>
    </main>
  );
}
