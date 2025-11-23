"use client";

import { Badge, BadgeProps } from "../../Badge";
import { Checkbox } from "../../Checkbox";
import { formatters } from "@/lib/utils";
import { ColumnDef, createColumnHelper, Row } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { ConditionFilter } from "./DataTableFilter";
import { DataTableRowActions } from "./DataTableRowActions";
import { TransactionType } from "@/lib/types";

const columnHelper = createColumnHelper<TransactionType>();

const statuses = [
  { value: "Paid", label: "Paid", variant: "success" },
  { value: "pending", label: "Pending", variant: "warning" },
];

const schoolMapping: Record<string, string> = {
  "1005": "SARCOE",
  "1001": "AKCILS",
  // "1003": "KUSTWUDIL",
  "1002": "CASKANO",
  "1008": "KSPOLY",
  "1013": "RMK-CARS",
  "1009": "ABCOA_DBT", // ABCOA_DBT
  "1010": "CONAM", // CONAM
  "1012": "ADUSTECH", // ADUSTECH-1
  "1011": "KUSTWUDIL", // KUSTWUDIL
  "1015": "GHACOL", // GHACOL
};

export const getColumns = ({
  onRowClick,
}: {
  onRowClick: (row: Row<TransactionType>) => void;
}) =>
  [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
              ? "indeterminate"
              : false
          }
          onCheckedChange={() => table.toggleAllPageRowsSelected()}
          className="translate-y-0.5"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={() => row.toggleSelected()}
          className="translate-y-0.5"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        displayName: "Select",
      },
    }),
    columnHelper.accessor("payment_item", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Item" />
      ),
      enableSorting: true,
    }),

    columnHelper.accessor("reference", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trans Ref" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span
          className="block max-w-[150px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
          title={getValue()}
        >
          {getValue()}
        </span>
      ),
    }),

    columnHelper.accessor("status", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const statusValue = row.getValue("status"); // Get the status from API data
        const status = statuses.find((item) => item.value === statusValue);

        if (!status) {
          return <Badge variant="neutral">Unknown</Badge>; // Handle unknown status
        }

        return (
          <Badge variant={status.variant as BadgeProps["variant"]}>
            {status.label}
          </Badge>
        );
      },
    }),

    columnHelper.accessor("school_id", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Institution" />
      ),

      enableSorting: false,

      filterFn: "arrIncludesSome",
      cell: ({ row }) => {
        const schoolId = row.getValue("school_id") as string; // Explicitly cast to string
        return schoolMapping[schoolId] || "Unknown"; // Default to "Unknown" if not found
      },
    }),

    columnHelper.accessor("amount", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-medium">
          {formatters.currency(Number(getValue()))}
        </span>
      ),

      filterFn: (row, columnId, filterValue: ConditionFilter) => {
        const value = row.getValue(columnId) as number;
        const [min, max] = filterValue.value as [number, number];

        switch (filterValue.condition) {
          case "is-equal-to":
            return value == min;
          case "is-between":
            return value >= min && value <= max;
          case "is-greater-than":
            return value > min;
          case "is-less-than":
            return value < min;
          default:
            return true;
        }
      },
    }),
    columnHelper.accessor("updated_at", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      enableSorting: true,
    }),
    columnHelper.display({
      id: "edit",
      header: "View",
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "text-right",
        displayName: "View",
      },
      cell: ({ row }) => (
        <DataTableRowActions row={row} onRowClick={onRowClick} />
      ),
    }),
  ] as ColumnDef<TransactionType>[];
