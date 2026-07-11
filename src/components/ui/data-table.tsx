"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Search, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  onRowClick?: (data: TData) => void;

  // Server-side props
  isServerSide?: boolean;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  totalItems?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  onRowClick,
  isServerSide = false,
  pageIndex = 0,
  pageSize = 10,
  pageCount = 1,
  totalItems = 0,
  searchValue = "",
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    pageCount: isServerSide ? pageCount : undefined,
    manualPagination: isServerSide,
    manualFiltering: isServerSide,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(isServerSide ? { pagination: { pageIndex, pageSize } } : {}),
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Virtual scroll
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(600);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => setScrollTop(container.scrollTop);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries)
        setContainerHeight(entry.contentRect.height || 600);
    });
    container.addEventListener("scroll", handleScroll, { passive: true });
    ro.observe(container);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      ro.disconnect();
    };
  }, []);

  const rows = table.getRowModel().rows || [];
  const rowHeight = 72;
  const overscan = 5;
  const totalRows = rows.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan,
  );
  const visibleRows = rows.slice(startIndex, endIndex);
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = (totalRows - endIndex) * rowHeight;

  // Computed pagination info
  const currentPageIndex = isServerSide
    ? pageIndex
    : table.getState().pagination.pageIndex;
  const currentPageSize = isServerSide
    ? pageSize
    : table.getState().pagination.pageSize;
  const currentPageCount = isServerSide ? pageCount : table.getPageCount();
  const currentTotal = isServerSide
    ? totalItems
    : table.getFilteredRowModel().rows.length;

  const handlePageSizeChange = (val: string) => {
    const size = Number(val);
    if (isServerSide) {
      onPageSizeChange?.(size);
    } else {
      table.setPageSize(size);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Optional search bar */}
      {searchKey && (
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={`Search ${searchKey}...`}
              value={
                isServerSide
                  ? searchValue
                  : ((table.getColumn(searchKey)?.getFilterValue() as string) ??
                    "")
              }
              onChange={(e) =>
                isServerSide
                  ? onSearchChange?.(e.target.value)
                  : table.getColumn(searchKey)?.setFilterValue(e.target.value)
              }
              className="h-10 w-[250px] pl-10 rounded-xl border-slate-200 focus-visible:ring-primary/20 bg-white shadow-sm transition-all"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div
        ref={containerRef}
        className="w-full overflow-auto max-h-[600px] border border-slate-200 rounded-xl shadow-sm bg-white relative scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent"
      >
        <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent bg-slate-50/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm shadow-sm h-12 p-0 border-r border-b border-slate-200 last:border-r-0 text-primary"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-2 px-6 h-full w-full text-primary font-bold uppercase tracking-wider text-[11px]",
                          header.column.getCanSort() &&
                            "cursor-pointer select-none hover:bg-zinc-100/50 transition-colors",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="ml-2 h-3 w-3 text-primary/50" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr style={{ height: `${paddingTop}px` }}>
                <td colSpan={columns.length} className="p-0 border-none" />
              </tr>
            )}
            {visibleRows.length ? (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn("group", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 px-6 group-hover:bg-slate-50/50 transition-colors border-r border-b border-slate-200 last:border-r-0"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center font-medium text-zinc-400"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
            {paddingBottom > 0 && (
              <tr style={{ height: `${paddingBottom}px` }}>
                <td colSpan={columns.length} className="p-0 border-none" />
              </tr>
            )}
          </TableBody>
        </table>
      </div>

      {/* Footer: per-page selector + page info + prev/next */}
      <div className="flex items-center justify-between px-1 py-1">
        {/* Left: rows-per-page + total */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Rows per page
          </span>
          <Select
            value={String(currentPageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-9 w-20 rounded-xl border-zinc-100 shadow-sm bg-white text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  className="text-xs font-bold"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs font-medium text-zinc-400">
            of <span className="text-zinc-700 font-bold">{currentTotal}</span>{" "}
            results
          </span>
        </div>

        {/* Right: page X of Y + buttons */}
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-zinc-400">
            Page{" "}
            <span className="text-primary font-black">
              {currentPageIndex + 1}
            </span>{" "}
            of {currentPageCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-xl border-slate-200 hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95"
              onClick={() =>
                isServerSide
                  ? onPageChange?.(pageIndex - 1)
                  : table.previousPage()
              }
              disabled={
                isServerSide ? pageIndex === 0 : !table.getCanPreviousPage()
              }
            >
              <span className="sr-only">Previous page</span>
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-xl border-slate-200 hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95"
              onClick={() =>
                isServerSide ? onPageChange?.(pageIndex + 1) : table.nextPage()
              }
              disabled={
                isServerSide
                  ? pageIndex + 1 >= pageCount
                  : !table.getCanNextPage()
              }
            >
              <span className="sr-only">Next page</span>
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
