"use client"

import * as React from "react"
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
} from "@tanstack/react-table"
import { ChevronDown, Settings2, Search, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  onRowClick?: (data: TData) => void

  // Server-side props
  isServerSide?: boolean
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  totalItems?: number
  searchValue?: string
  onSearchChange?: (value: string) => void
  onPageChange?: (page: number) => void
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

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
      ...(isServerSide ? {
        pagination: {
          pageIndex,
          pageSize,
        }
      } : {})
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          {searchKey && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={`Search ${searchKey}...`}
                value={isServerSide ? searchValue : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")}
                onChange={(event) =>
                  isServerSide
                    ? onSearchChange?.(event.target.value)
                    : table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="h-10 w-[250px] pl-10 rounded-xl border-slate-200 focus-visible:ring-primary/20 bg-white shadow-sm transition-all"
              />
            </div>
          )}
        </div>
      </div>
      <div className="w-full overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-200 bg-slate-50/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className="h-12 p-0 border-l border-slate-200 first:border-l-0 text-primary"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-2 px-6 h-full w-full text-primary font-bold uppercase tracking-wider text-[11px]",
                            header.column.getCanSort() && "cursor-pointer select-none hover:bg-zinc-100/50 transition-colors"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="ml-2 h-3 w-3 text-primary/50" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "group border-b border-slate-200 last:border-b-0",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className="py-4 px-6 group-hover:bg-slate-50/50 transition-colors border-l border-slate-200 first:border-l-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-b-3xl border-t border-slate-100">
        <div className="flex-1 text-sm font-medium text-zinc-500">
           Showing <span className="text-zinc-900 font-bold">{isServerSide ? data.length : table.getRowModel().rows.length}</span> of{" "}
          <span className="text-zinc-900 font-bold">{isServerSide ? totalItems : table.getFilteredRowModel().rows.length}</span> results
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-bold text-zinc-500">
              Page <span className="text-primary">{isServerSide ? (pageIndex + 1) : (table.getState().pagination.pageIndex + 1)}</span> of {isServerSide ? pageCount : table.getPageCount()}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-xl border-slate-200 hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95"
              onClick={() => isServerSide ? onPageChange?.(pageIndex - 1) : table.previousPage()}
              disabled={isServerSide ? (pageIndex === 0) : !table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-xl border-slate-200 hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95"
              onClick={() => isServerSide ? onPageChange?.(pageIndex + 1) : table.nextPage()}
              disabled={isServerSide ? ((pageIndex + 1) >= pageCount) : !table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
