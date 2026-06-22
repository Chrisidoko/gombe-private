"use client";

import { Badge, BadgeProps } from "../../Badge";
import { Checkbox } from "../../Checkbox";
import { formatters } from "@/lib/utils";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { ConditionFilter } from "./DataTableFilter";
import { TransactionType } from "@/lib/types";

const columnHelper = createColumnHelper<TransactionType>();

const statuses = [
  { value: "Paid", label: "Paid", variant: "success" },
  { value: "pending", label: "Pending", variant: "warning" },
];

export const getColumns = () =>
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
    columnHelper.accessor("school_name", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Institution" />
      ),
      enableSorting: true,
      cell: ({ getValue, row }) => {
        const name = getValue();
        const id = row.original.school_id;
        return (
          <div>
            <span
              className="block max-w-[180px] truncate font-medium text-gray-800"
              title={name ?? id}
            >
              {name ?? id}
            </span>
            <span className="text-xs text-gray-400">{id}</span>
          </div>
        );
      },
    }),

    columnHelper.accessor("payment_item", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Item" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span
          className="block max-w-[160px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
          title={getValue()}
        >
          {getValue()}
        </span>
      ),
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
      filterFn: "equals",
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

    columnHelper.accessor("lga", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="LGA" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => getValue() ?? "—",
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
        const value = parseFloat(row.getValue(columnId) as string);
        const min = parseFloat(filterValue.value[0] as string);
        const max = parseFloat(filterValue.value[1] as string);

        switch (filterValue.condition) {
          case "is-equal-to":
            return value === min;
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
      cell: ({ getValue }) => {
        const d = new Date(getValue());
        const date = d.toISOString().slice(0, 10); // 2026-04-23
        const time = d.toTimeString().slice(0, 5); // 09:30
        return `${date} ${time}`;
      },
    }),
  ] as ColumnDef<TransactionType>[];
