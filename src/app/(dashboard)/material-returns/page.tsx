"use client"

import { useState, useEffect, useMemo } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Loader2, Search } from "lucide-react"
import { materialReturnService } from "@/service/materialReturn.api"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

export default function MaterialReturnsPage() {
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const fetchReturns = async () => {
    setIsLoading(true)
    try {
      const response = await materialReturnService.getReturns({ limit: 500 })
      setReturns(response.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load Material Returns")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [])

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        (r.materialId?.itemName || r.materialId?.name || "").toLowerCase().includes(searchLower) ||
        (r.projectId?.projectName || r.projectId?.name || "").toLowerCase().includes(searchLower) ||
        (r.returnLocation || "").toLowerCase().includes(searchLower)
      )
    })
  }, [returns, searchQuery])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "material",
      header: "Material",
      cell: ({ row }) => row.original.materialId?.itemName || row.original.materialId?.name || "Unknown",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => row.original.projectId?.projectName || row.original.projectId?.name || "N/A",
    },
    {
      accessorKey: "returnLocation",
      header: "Return Location",
      cell: ({ row }) => row.original.returnLocation || "-",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <ContentLayout title="Material Returns">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Material Returns</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">Manage material returns to warehouse</p>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Input 
              placeholder="Search returns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold text-sm shadow-sm" 
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
              <p className="text-zinc-500 font-bold text-xs">Loading returns...</p>
            </div>
          ) : (
            <div className="p-4">
              <DataTable columns={columns} data={filteredReturns} />
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  )
}
