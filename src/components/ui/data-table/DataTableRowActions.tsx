// DataTableRowActions
"use client";
import { Button } from "@/components/Button";
import { RiMoreFill } from "@remixicon/react";
import { Row } from "@tanstack/react-table";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onRowClick: (row: Row<TData>) => void;
}

export function DataTableRowActions<TData>({
  row,
  onRowClick,
}: DataTableRowActionsProps<TData>) {
  return (
    <Button
      variant="ghost"
      onClick={() => onRowClick(row)}
      className="group aspect-square p-1.5 hover:border hover:border-gray-300 data-[state=open]:border-gray-300 data-[state=open]:bg-gray-50"
    >
      <RiMoreFill
        className="size-4 shrink-0 text-gray-500 group-hover:text-gray-700 group-data-[state=open]:text-gray-700"
        aria-hidden="true"
      />
    </Button>
  );
}
