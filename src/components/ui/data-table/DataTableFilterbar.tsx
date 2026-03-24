/* eslint-disable */
"use client";

import { Button } from "../../Button";
import { Searchbar } from "../../Searchbar";
import { formatters } from "@/lib/utils";
import { RiDownloadLine } from "@remixicon/react";
import { Table } from "@tanstack/react-table";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { DataTableFilter } from "./DataTableFilter";
import { utils, writeFile } from "xlsx";
import * as XLSX from "xlsx";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

const conditions: { value: string; label: string }[] = [
  {
    value: "is-equal-to",
    label: "is equal to",
  },
  {
    value: "is-between",
    label: "is between",
  },
  {
    value: "is-greater-than",
    label: "is greater than",
  },
  {
    value: "is-less-than",
    label: "is less than",
  },
];

export function Filterbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const debouncedSetFilterValue = useDebouncedCallback((value) => {
    table.getColumn("reference")?.setFilterValue(value);
  }, 300);

  const statuses: { label: string; value: string }[] = [
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "Paid" },
  ];

  // const schools: { label: string; value: string }[] = [
  //   { label: "SARCOE", value: "1005" },
  //   { label: "AKCILS", value: "1001" },
  //   { label: "CASKANO", value: "1002" },

  // ];

  const handleSearchChange = (event: any) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSetFilterValue(value);
  };

  const handleExportCSV = () => {
    const filteredData = table
      .getFilteredRowModel()
      .rows.map((row) => row.original); // Get currently filtered rows

    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    // Convert JSON to CSV format
    const worksheet = utils.json_to_sheet(filteredData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Filtered Data");

    // Download as CSV file
    writeFile(workbook, "filtered_data.csv");
  };

  const handleExportExcel = () => {
    const filteredData = table
      .getFilteredRowModel()
      .rows.map((row) => row.original); // Get currently filtered rows

    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    // Convert JSON to Excel format
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Data");

    // Download as Excel file
    XLSX.writeFile(workbook, "filtered_data.xlsx");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-x-6">
      <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center">
        {table.getColumn("status")?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
            type="select"
          />
        )}

        {/* <DataTableFilter
          column={table.getColumn("school_id")}
          title="Institutions"
          options={schools}
          type="checkbox"
        /> */}

        {table.getColumn("amount")?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn("amount")}
            title="Amount"
            type="number"
            options={conditions}
            formatter={formatters.currency}
          />
        )}
        {table.getColumn("reference")?.getIsVisible() && (
          <Searchbar
            type="search"
            placeholder="Bill Reference"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:max-w-[250px] sm:[&>input]:h-[30px]"
          />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="border border-gray-200 px-2 font-semibold text-[#737791] sm:border-none sm:py-1"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={handleExportCSV}
          className="hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
        >
          <RiDownloadLine className="size-4 shrink-0" aria-hidden="true" />
          CSV
        </Button>

        <Button
          variant="secondary"
          onClick={handleExportExcel}
          className="hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
        >
          <RiDownloadLine className="size-4 shrink-0" aria-hidden="true" />
          Excel
        </Button>
      </div>
    </div>
  );
}
