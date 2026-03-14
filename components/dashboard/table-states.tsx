import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export const TableLoadingRows = memo(function TableLoadingRows({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
});

export const TableEmptyRow = memo(function TableEmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-24 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
});
