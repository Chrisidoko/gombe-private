import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    displayName: string;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
