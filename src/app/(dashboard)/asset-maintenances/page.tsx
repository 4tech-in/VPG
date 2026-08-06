"use client"

import { useState, useEffect, useMemo } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Loader2, Search, Eye } from "lucide-react"
import { assetMaintenanceService } from "@/service/assetMaintenance.api"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function AssetMaintenancesPage() {
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  
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
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.assetId?.assetName || row.original.assetId?.name || "Unknown"}</span>
          {(row.original.assetId?.type || row.original.assetId?.serialNumber) && (
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
              {row.original.assetId?.type || "Asset"} {row.original.assetId?.serialNumber ? `(${row.original.assetId.serialNumber})` : ''}
            </span>
          )}
        </div>
      )
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
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.notes || ""}>
          {row.original.notes || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedRecord(row.original)}
          className="h-8 text-xs font-bold"
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View
        </Button>
      ),
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

      {/* Details Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl bg-white border-zinc-200 p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <DialogTitle className="text-xl font-black text-zinc-900">Asset Maintenance Details</DialogTitle>
            <DialogDescription className="font-semibold text-zinc-500 text-sm">
              Complete details of the maintenance record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Name</p>
                <p className="font-bold text-sm text-zinc-900">{selectedRecord.assetId?.assetName || selectedRecord.assetId?.name || "Unknown"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Type / Serial No</p>
                <p className="font-bold text-sm text-zinc-700">
                  {selectedRecord.assetId?.type || "N/A"} {selectedRecord.assetId?.serialNumber ? `(${selectedRecord.assetId.serialNumber})` : ''}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendor</p>
                <p className="font-bold text-sm text-zinc-900">{selectedRecord.vendorId?.vendorName || selectedRecord.vendorId?.name || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Company Name</p>
                <p className="font-bold text-sm text-zinc-700">{selectedRecord.vendorId?.companyName || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance Period</p>
                <p className="font-bold text-sm text-zinc-700">
                  {selectedRecord.fromDate ? new Date(selectedRecord.fromDate).toLocaleDateString() : "-"} 
                  {" to "} 
                  {selectedRecord.toDate ? new Date(selectedRecord.toDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Created By</p>
                <p className="font-bold text-sm text-zinc-700">{selectedRecord.createdBy?.name || "-"} <span className="text-zinc-400 font-normal">({selectedRecord.createdBy?.email || "-"})</span></p>
              </div>
              <div className="col-span-2 space-y-1 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Notes</p>
                <p className="font-medium text-sm text-zinc-800 whitespace-pre-wrap">{selectedRecord.notes || "No additional notes provided."}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
