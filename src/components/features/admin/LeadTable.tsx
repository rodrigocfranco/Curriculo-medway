import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadRow } from "@/lib/schemas/leads";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const columns: ColumnDef<LeadRow>[] = [
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Telefone" },
  { accessorKey: "state", header: "UF" },
  { accessorKey: "university", header: "Faculdade" },
  { accessorKey: "graduation_year", header: "Ano" },
  { accessorKey: "specialty_interest", header: "Especialidade" },
  {
    accessorKey: "created_at",
    header: "Cadastro",
    cell: ({ getValue }) => (
      <span className="tabular-nums">{formatDate(getValue<string>())}</span>
    ),
  },
];

type Props = {
  data: LeadRow[];
  totalCount: number;
  pagination: PaginationState;
  sorting: SortingState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  isLoading: boolean;
  onRowClick: (leadId: string) => void;
};

export default function LeadTable({
  data,
  totalCount,
  pagination,
  sorting,
  onPaginationChange,
  onSortingChange,
  isLoading,
  onRowClick,
}: Props) {
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const pageIndex = pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div>
      <div className="rounded-md border border-neutral-200" aria-busy={isLoading}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const ariaSortValue = sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";
                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      aria-sort={ariaSortValue}
                      className="text-xs font-medium text-navy-900"
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                        )}
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, ci) => (
                      <TableCell key={ci}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhum lead encontrado.
                      </TableCell>
                    </TableRow>
                  )
                : table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-lead-id={row.original.id}
                      tabIndex={0}
                      role="button"
                      className={cn(
                        "cursor-pointer text-sm hover:bg-muted/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                      )}
                      onClick={() => onRowClick(row.original.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row.original.id);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between px-1 py-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {totalCount > 0
            ? `${pageIndex * pagination.pageSize + 1}–${Math.min((pageIndex + 1) * pagination.pageSize, totalCount)} de ${totalCount}`
            : "0 resultados"}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="h-8 w-8 p-0 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {pageIndex + 1} / {pageCount || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="h-8 w-8 p-0 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { Props as LeadTableProps };
