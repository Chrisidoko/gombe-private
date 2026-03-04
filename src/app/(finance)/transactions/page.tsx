"use client";

import { useState, useEffect } from "react";
import { Divider } from "@/components/Divider";
import { TransactionType } from "@/lib/types";

import { getColumns } from "@/components/ui/data-table/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
// import { ChevronsUpDown } from "lucide-react";
import { Row } from "@tanstack/react-table";
// import { DataTableDrawer } from "@/components/ui/data-table/DataTableDrawer";

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  // const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    perPage: 20,
    page: 1,
    startDate: "2025-10-01",
    endDate: "2026-12-31",
  });

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
          <p className="text-gray-500 sm:text-sm/6">Transactions History</p>
        </div>
      </div>
      <Divider />

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
