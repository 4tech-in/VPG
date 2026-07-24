"use client"

import { useState, useEffect, useMemo } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Loader2, Search } from "lucide-react"
import { assetSiteTransferService } from "@/service/assetSiteTransfer.api"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

export default function AssetSiteTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const fetchTransfers = async () => {
    setIsLoading(true)
    try {
      const response = await assetSiteTransferService.getTransfers({ limit: 500 })
      setTransfers(response.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load Asset Site Transfers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await assetSiteTransferService.approveTransfer(id)
      toast.success("Transfer approved successfully")
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.message || "Failed to approve transfer")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await assetSiteTransferService.rejectTransfer(id)
      toast.success("Transfer rejected successfully")
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.message || "Failed to reject transfer")
    }
  }

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        (t.assetId?.assetName || t.assetId?.name || "").toLowerCase().includes(searchLower) ||
        (t.fromProjectId?.projectName || t.fromProjectId?.name || "").toLowerCase().includes(searchLower) ||
        (t.toProjectId?.projectName || t.toProjectId?.name || "").toLowerCase().includes(searchLower) ||
        (t.notes || "").toLowerCase().includes(searchLower)
      )
    })
  }, [transfers, searchQuery])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset",
      cell: ({ row }) => row.original.assetId?.assetName || row.original.assetId?.name || "Unknown",
    },
    {
      accessorKey: "fromProject",
      header: "From Project",
      cell: ({ row }) => row.original.fromProjectId?.projectName || row.original.fromProjectId?.name || "N/A",
    },
    {
      accessorKey: "toProject",
      header: "To Project",
      cell: ({ row }) => row.original.toProjectId?.projectName || row.original.toProjectId?.name || "N/A",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.original.notes || "-",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "Pending"
        let color = "text-amber-600 bg-amber-50"
        if (status === "Approved") color = "text-emerald-600 bg-emerald-50"
        if (status === "Rejected") color = "text-rose-600 bg-rose-50"
        
        return (
          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${color}`}>
            {status}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const status = row.original.status || "Pending"
        if (status !== "Pending") return null

        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleApprove(row.original._id)}
              className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Approve
            </button>
            <button 
              onClick={() => handleReject(row.original._id)}
              className="px-3 py-1 text-xs font-bold text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors"
            >
              Reject
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Asset Site Transfers">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Asset Site Transfers</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">Manage asset transfers between sites</p>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Input 
              placeholder="Search transfers..." 
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
              <p className="text-zinc-500 font-bold text-xs">Loading transfers...</p>
            </div>
          ) : (
            <div className="p-4">
              <DataTable columns={columns} data={filteredTransfers} />
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  )
}
