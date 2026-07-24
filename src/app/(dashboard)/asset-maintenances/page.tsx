"use client"

import { useState, useEffect, useMemo } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Loader2, Search } from "lucide-react"
import { assetMaintenanceService } from "@/service/assetMaintenance.api"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

export default function AssetMaintenancesPage() {
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const fetchMaintenances = async () => {
    setIsLoading(true)
    try {
      const response = await assetMaintenanceService.getMaintenances({ limit: 500 })
      setMaintenances(response.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load Asset Maintenances")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMaintenances()
  }, [])

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((m) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        (m.assetId?.assetName || m.assetId?.name || "").toLowerCase().includes(searchLower) ||
        (m.vendorId?.vendorName || m.vendorId?.name || "").toLowerCase().includes(searchLower) ||
        (m.notes || "").toLowerCase().includes(searchLower)
      )
    })
  }, [maintenances, searchQuery])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset",
      cell: ({ row }) => row.original.assetId?.assetName || row.original.assetId?.name || "Unknown",
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendorId?.vendorName || row.original.vendorId?.name || "N/A",
    },
    {
      accessorKey: "fromDate",
      header: "From Date",
      cell: ({ row }) => row.original.fromDate ? new Date(row.original.fromDate).toLocaleDateString() : "-",
    },
    {
      accessorKey: "toDate",
      header: "To Date",
      cell: ({ row }) => row.original.toDate ? new Date(row.original.toDate).toLocaleDateString() : "-",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.original.notes || "-",
    },
  ]

  return (
    <ContentLayout title="Asset Maintenance">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Asset Maintenance</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">Manage asset maintenance and repair records</p>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Input 
              placeholder="Search records..." 
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
              <p className="text-zinc-500 font-bold text-xs">Loading maintenance records...</p>
            </div>
          ) : (
            <div className="p-4">
              <DataTable columns={columns} data={filteredMaintenances} />
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  )
}
