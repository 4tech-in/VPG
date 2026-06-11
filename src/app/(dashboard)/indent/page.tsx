"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  MoreVertical,
  Clock,
  FileText,
  CheckCircle2,
  Filter,
  Eye,
  Check,
  X,
  XCircle
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ViewIndentDialog, CreateIndentDialog } from "@/components/indent/indent-dialogs"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { indentService } from "@/service/indents.api"
import { exportIndentReceipt } from "@/lib/export-receipt"

const mapBackendStatusToUI = (status: string) => {
  switch (status) {
    case "Pending": return "PENDING MANAGER"
    case "Approved": return "APPROVED"
    case "ConvertedToPO": return "PO CREATED"
    case "Rejected": return "REJECTED"
    default: return status
  }
}

export default function IndentPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const fetchIndents = async (search = "") => {
    try {
      setLoading(true)
      const res = await indentService.getIndents({ search })
      if (Array.isArray(res)) {
        setData(res)
      } else if (res && res.data) {
        setData(res.data)
      } else {
        setData([])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch indents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchIndents(searchTerm)
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const handleStatusChange = async (id: string, newStatus: string, reason?: string) => {
    try {
      await indentService.updateIndentStatus(id, { status: newStatus, rejectionReason: reason })
      if (newStatus === "Rejected") {
        toast.error(`Indent has been rejected${reason ? `: "${reason}"` : ""}`)
      } else {
        toast.success(`Indent status updated to ${newStatus}`)
      }
      fetchIndents(searchTerm)
    } catch (err: any) {
      toast.error(err.message || "Failed to update indent status")
    }
  }

  const handleConfirmReject = () => {
    if (!rejectingId) return
    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for rejection")
      return
    }
    handleStatusChange(rejectingId, "Rejected", rejectionReason)
    setRejectingId(null)
    setRejectionReason("")
  }

  const handleCancelReject = () => {
    setRejectingId(null)
    setRejectionReason("")
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "indentId",
      header: "Indent ID",
      cell: ({ row }) => <div className="font-bold text-emerald-500">{row.getValue("indentId")}</div>,
    },
    {
      accessorKey: "requester",
      header: "Requester",
      cell: ({ row }) => {
        const req = row.original.requestedBy
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{req?.name || "Unknown"}</span>
            <span className="text-[10px] text-zinc-400 font-medium">{req?.email || "Requester"}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "project",
      header: "Project / Area",
      cell: ({ row }) => {
        const proj = row.original.projectId
        const tower = row.original.towerId
        const outside = row.original.outsideId
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{proj?.projectName || proj?.name || "N/A"}</span>
            <span className="text-[10px] text-zinc-400 font-medium">
              {outside?.outsideName || outside?.name || tower?.towerName || tower?.name || "N/A"}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items || []
        const count = items.length
        const preview = items.map((i: any) => i.itemId?.itemName || i.itemId?.name || "Unknown").join(", ")
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{count} Items</span>
            <span className="text-[10px] text-zinc-400 font-medium max-w-[200px] truncate" title={preview}>{preview}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "used",
      header: "Used Qty",
      cell: ({ row }) => {
        const usage = row.original.usage
        if (!usage || usage.received === 0) {
          return <div className="text-zinc-300 font-bold text-[11px]">—</div>
        }
        return (
          <div className="flex items-center gap-1 text-zinc-900 font-bold text-xs">
            <span className="text-[13px] font-black text-zinc-900">{usage.used}</span>
            <span className="text-[11px] text-zinc-300 font-normal">/</span>
            <span className="text-[12px] text-zinc-500 font-bold">{usage.received}</span>
            <span className="text-[9px] text-zinc-400 font-black tracking-wider uppercase ml-1">{usage.unit}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const id = row.original._id
        const rejectionReason = row.original.rejectionReason
        const uiStatus = mapBackendStatusToUI(status)

        if (status !== "Pending") {
          return (
            <div className="flex flex-col gap-1.5">
              <div className={cn(
                "h-9 px-4 rounded-xl flex items-center justify-center font-black text-[9px] tracking-[0.15em] uppercase transition-all shadow-sm w-[160px]",
                status === "Approved" ? "bg-blue-50 text-blue-600" :
                status === "ConvertedToPO" ? "bg-emerald-50 text-emerald-600" :
                "bg-rose-50 text-rose-500"
              )}>
                <div className="flex items-center gap-2">
                  {status === "Approved" && <FileText className="h-3 w-3" />}
                  {status === "ConvertedToPO" && <CheckCircle2 className="h-3 w-3" />}
                  {status === "Rejected" && <X className="h-3 w-3" />}
                  <span>{uiStatus}</span>
                </div>
              </div>
              {status === "Rejected" && rejectionReason && (
                <span className="text-[10px] text-rose-500 font-bold italic max-w-[160px] truncate leading-tight mt-1" title={rejectionReason}>
                  &quot;{rejectionReason}&quot;
                </span>
              )}
            </div>
          )
        }

        return (
          <div className="flex items-center justify-start py-1">
            <div className="flex flex-col gap-1.5">
              <Select
                value={status}
                onValueChange={(val) => {
                  if (val === "Rejected") {
                    setRejectingId(id)
                  } else {
                    handleStatusChange(id, val)
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[160px] rounded-xl border-none font-black text-[9px] tracking-[0.15em] uppercase transition-all shadow-sm bg-amber-50 text-amber-600 hover:bg-amber-100/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <SelectValue placeholder="PENDING MANAGER" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-1">
                  <SelectItem value="Approved" className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-3 text-emerald-600">Approve</SelectItem>
                  <SelectItem value="Rejected" className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-3 text-rose-500">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => {
        const created = row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString("en-IN") : "N/A"
        return (
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-[11px]">
            <Clock className="h-3 w-3 text-zinc-300" />
            {created}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6">Operations</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-1 pr-4">
            <ViewIndentDialog
              indent={row.original}
              onStatusChange={handleStatusChange}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 font-bold text-[11px] gap-2 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportIndentReceipt(row.original)}
              className="h-9 px-3 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 font-bold text-[11px] gap-2 transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        );
      },
    },
  ]

  return (
    <ContentLayout title="Indent Requests">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Indent Requests</h1>

          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Input
                placeholder="Search material, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-2xl bg-white border-zinc-100 pl-11 font-medium shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>

            <CreateIndentDialog
              onSuccess={() => fetchIndents(searchTerm)}
              trigger={
                <Button className="h-12 px-6 rounded-2xl bg-zinc-900 text-white font-black shadow-lg shadow-zinc-900/10 gap-2 hover:scale-[1.01] transition-all">
                  <Plus className="h-4 w-4" /> Create Indent
                </Button>
              }
            />
          </div>
        </div>

        {/* Indent Board */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">
            Loading Indent Requests...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
          />
        )}
        
      </div>

      {/* Reject Indent Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) handleCancelReject() }}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col mx-4 bg-white">
          <div className="p-8 pb-4 shrink-0 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status Change</span>
                <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Reject Indent</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
              Please provide a clear reason for rejecting this indent request.
            </DialogDescription>
          </div>

          <div className="flex-1 p-8 pt-2 space-y-4 bg-zinc-50/10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rejection Reason</Label>
              <Textarea
                placeholder="e.g. Insufficient budget, duplicate request, or incorrect specifications..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] rounded-2xl bg-white border-zinc-100 focus:ring-rose-500 focus:border-rose-500 font-bold shadow-inner p-4 text-xs resize-none"
              />
            </div>
          </div>

          <div className="p-8 bg-rose-50/20 border-t border-rose-100 shrink-0 flex gap-4">
            <Button
              variant="outline"
              onClick={handleCancelReject}
              className="flex-1 h-12 rounded-xl border-zinc-100 text-zinc-500 font-black text-xs hover:bg-zinc-50 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-black text-xs gap-2 shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
