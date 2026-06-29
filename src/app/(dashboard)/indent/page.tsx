"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  XCircle,
  Trash2
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import { useAuthStore } from "@/store/use-auth-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ViewIndentDialog, CreateIndentDialog } from "@/components/indent/indent-dialogs"
import { CreatePODialog } from "@/components/purchase-order/po-dialogs"
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
import { unitService } from "@/service/unitService"
import { exportIndentReceipt } from "@/lib/export-receipt"

const getImageUrl = (filePath: string) => {
  if (!filePath) return ""
  if (filePath.startsWith("http")) return filePath
  let cleanPath = filePath
  if (filePath.startsWith("/uploads/")) {
    cleanPath = `/api${filePath}`
  }
  const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}`
  try {
    const origin = new URL(baseUrl).origin
    return `${origin}${cleanPath}`
  } catch (e) {
    return `http://localhost:9090${cleanPath}`
  }
}

const mapBackendStatusToUI = (status: string) => {
  switch (status) {
    case "Pending": return "PENDING MANAGER"
    case "ManagerApproved": return "PENDING ADMIN"
    case "Approved": return "APPROVED"
    case "ConvertedToPO": return "PO CREATED"
    case "Rejected": return "REJECTED"
    default: return status
  }
}

export default function IndentPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvingIndent, setApprovingIndent] = useState<any | null>(null)
  const [approvalItems, setApprovalItems] = useState<any[]>([])
  const [approveRemark, setApproveRemark] = useState("")
  const [storageLocation, setStorageLocation] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [units, setUnits] = useState<any[]>([])
  const [unitsPage, setUnitsPage] = useState(1)
  const [hasMoreUnits, setHasMoreUnits] = useState(true)
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const fetchUnits = async (pageToFetch = 1, reset = false) => {
    if (isLoadingUnits || (!hasMoreUnits && !reset)) return
    setIsLoadingUnits(true)
    try {
      const res = await unitService.getUnits({ page: pageToFetch, limit: 10 })
      const newUnits = res.units || []
      
      setUnits(prev => reset ? newUnits : [...prev, ...newUnits])
      setUnitsPage(pageToFetch)
      
      const totalPages = res.pagination?.totalPages || 1
      setHasMoreUnits(pageToFetch < totalPages)
    } catch (err) {
      console.error("Failed to fetch units:", err)
    } finally {
      setIsLoadingUnits(false)
    }
  }

  useEffect(() => {
    if (approvingIndent) {
      setStorageLocation(approvingIndent.storageLocation || "")
      setApprovalItems(
        (approvingIndent.items || []).map((item: any) => ({
          itemId: item.itemId?._id || item.itemId,
          itemName: item.itemId?.itemName || item.itemId?.name || "Unknown",
          unitId: item.unitId?._id || item.unitId,
          unitName: item.unitId?.label || item.unitId?.value || item.unitId?.unitName || item.unitId?.name || "Units",
          quantity: item.quantity,
          description: item.description || "",
          status: "Approved",
          images: item.images || []
        }))
      )
    } else {
      setApprovalItems([])
      setStorageLocation("")
      setUnits([])
      setUnitsPage(1)
      setHasMoreUnits(true)
    }
  }, [approvingIndent])

  const fetchIndents = async (search = "", statusFilter = selectedStatus) => {
    try {
      setLoading(true)
      const params: any = { search }
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "Pending") {
          const isAdmin = user?.roleId?.name?.toLowerCase() === "admin"
          params.status = isAdmin ? "ManagerApproved" : "Pending"
        } else {
          params.status = statusFilter
        }
      }
      const res = await indentService.getIndents(params)
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
      fetchIndents(searchTerm, selectedStatus)
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm, selectedStatus])

  const handleStatusChange = async (id: string, newStatus: string, reason?: string, items?: any[], storageLocationVal?: string) => {
    try {
      const payload: any = { status: newStatus }
      if (newStatus === "Rejected") {
        payload.rejectionReason = reason
      } else if (newStatus === "Approved") {
        payload.approveRemark = reason
        if (items) {
          payload.items = items
        }
        if (storageLocationVal !== undefined) {
          payload.storageLocation = storageLocationVal
        }
      }
      await indentService.updateIndentStatus(id, payload)
      if (newStatus === "Rejected") {
        toast.error(`Indent has been rejected${reason ? `: "${reason}"` : ""}`)
      } else {
        toast.success(`Indent status updated to ${newStatus}`)
      }
      fetchIndents(searchTerm, selectedStatus)
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

  const handleConfirmApprove = () => {
    if (!approvingIndent) return
    const approvedOnly = approvalItems.filter(i => i.status === "Approved")
    if (approvedOnly.length === 0) {
      toast.error("At least one item must be approved")
      return
    }
    if (approvedOnly.some(i => !i.quantity || Number(i.quantity) <= 0)) {
      toast.error("All approved quantities must be greater than 0")
      return
    }

    const formattedItems = approvedOnly.map(i => ({
      itemId: i.itemId,
      unitId: i.unitId,
      quantity: Number(i.quantity),
      description: i.description || "",
      images: i.images || []
    }))

    handleStatusChange(approvingIndent._id, "Approved", approveRemark, formattedItems, storageLocation)
    setApprovingIndent(null)
    setApproveRemark("")
    setStorageLocation("")
  }

  const handleCancelApprove = () => {
    setApprovingIndent(null)
    setApproveRemark("")
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const id = row.original._id
        const uiStatus = mapBackendStatusToUI(status)
        const isAdmin = user?.roleId?.name?.toLowerCase() === "admin"
        const showDropdown = isAdmin ? (status === "ManagerApproved") : (status === "Pending")

        if (!showDropdown) {
          return (
            <div className="flex flex-col gap-1.5">
              <div className={cn(
                "h-9 px-4 rounded-xl flex items-center justify-center font-black text-[9px] tracking-[0.15em] uppercase transition-all shadow-sm w-[160px]",
                status === "Approved" ? "bg-blue-50 text-blue-600" :
                  status === "ConvertedToPO" ? "bg-emerald-50 text-emerald-600" :
                    status === "Rejected" ? "bg-rose-50 text-rose-500" :
                      "bg-amber-50 text-amber-600"
              )}>
                <div className="flex items-center gap-2">
                  {(status === "Approved" || status === "ManagerApproved" || status === "Pending") && <Clock className="h-3 w-3" />}
                  {status === "ConvertedToPO" && <CheckCircle2 className="h-3 w-3" />}
                  {status === "Rejected" && <X className="h-3 w-3" />}
                  <span>{uiStatus}</span>
                </div>
              </div>
              {status === "Approved" && (
                <CreatePODialog
                  defaultIndentId={id}
                  onSuccess={() => fetchIndents(searchTerm)}
                  trigger={
                    <Button
                      className="h-8 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-[9px] tracking-[0.1em] uppercase transition-all shadow-sm w-[160px] gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create PO
                    </Button>
                  }
                />
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
                  } else if (val === "Approved") {
                    setApprovingIndent(row.original)
                  } else {
                    handleStatusChange(id, val)
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[160px] rounded-xl border-none font-black text-[9px] tracking-[0.15em] uppercase transition-all shadow-sm bg-amber-50 text-amber-600 hover:bg-amber-100/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{uiStatus}</span>
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

        {/* Status Tabs Filter */}
        <div className="flex border-b border-zinc-100 gap-8 overflow-x-auto pb-px scrollbar-none">
          {[
            { label: "All", value: "all" },
            { label: "Pending", value: "Pending" },
            { label: "Approved", value: "Approved" },
            { label: "Rejected", value: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={cn(
                "pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0",
                selectedStatus === tab.value
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-900"
              )}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Approve Indent Dialog */}
      <Dialog open={!!approvingIndent} onOpenChange={(open) => { if (!open) handleCancelApprove() }}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col mx-4 bg-white max-h-[90vh]">
          <div className="p-8 pb-4 shrink-0 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status Change</span>
                <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Approve Indent</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
              Please verify items list, adjust quantities, approve/reject items individually, and provide a remark.
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 bg-zinc-50/10 custom-scrollbar">
            {/* Storage Location Input */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Storage Location</Label>
              <Input
                placeholder="e.g. Store Room A, Site Office..."
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="h-11 rounded-xl bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-emerald-500 focus:border-emerald-500 font-bold px-4 text-xs"
              />
            </div>

            {/* Items modification section */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Items List (Approve / Reject & Adjust)</Label>
              <div className="space-y-3">
                {approvalItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-5 rounded-2xl border transition-all space-y-3",
                      item.status === "Rejected"
                        ? "bg-rose-50/20 border-rose-100/50 opacity-70"
                        : "bg-white border-zinc-100 shadow-sm"
                    )}
                  >
                    {/* First row: Item Name and Status Buttons */}
                    <div className="flex items-center justify-between border-b border-zinc-100/60 pb-2">
                      <span className={cn(
                        "font-black text-sm tracking-tight truncate",
                        item.status === "Rejected" ? "text-rose-900/60 line-through" : "text-zinc-950"
                      )}>
                        {item.itemName}
                      </span>

                      <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setApprovalItems(prev => prev.map((it, i) => i === idx ? { ...it, status: "Approved" } : it))
                          }}
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            item.status === "Approved"
                              ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                              : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                          )}
                          title="Approve Item"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setApprovalItems(prev => prev.map((it, i) => i === idx ? { ...it, status: "Rejected" } : it))
                          }}
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            item.status === "Rejected"
                              ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                              : "text-zinc-400 hover:text-rose-600 hover:bg-rose-100"
                          )}
                          title="Reject Item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Second row: Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          disabled={item.status === "Rejected"}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : 0
                            setApprovalItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it))
                          }}
                          className="h-10 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold focus:bg-white text-xs disabled:opacity-50 px-3"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Unit</Label>
                        <Select
                          disabled={item.status === "Rejected"}
                          value={item.unitId}
                          onValueChange={(val) => {
                            const selectedUnit = units.find(u => (u._id || u.id) === val)
                            setApprovalItems(prev => prev.map((it, i) => i === idx ? {
                              ...it,
                              unitId: val,
                              unitName: selectedUnit?.label || selectedUnit?.value || "Units"
                            } : it))
                          }}
                          onOpenChange={(open) => {
                            if (open && units.length === 0) {
                              fetchUnits(1, true)
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-none font-bold text-xs uppercase shadow-sm disabled:opacity-50">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent 
                            className="rounded-xl bg-white shadow-xl border border-zinc-100 max-h-60 overflow-y-auto"
                            onScroll={(e) => {
                              const target = e.currentTarget
                              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
                                if (hasMoreUnits && !isLoadingUnits) {
                                  fetchUnits(unitsPage + 1)
                                }
                              }
                            }}
                          >
                            {units.map((u) => (
                              <SelectItem key={u._id || u.id} value={u._id || u.id} className="text-[10px] font-bold uppercase py-2">
                                {u.label || u.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Third row: Description */}
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Description</Label>
                      <Input
                        placeholder="Enter details..."
                        disabled={item.status === "Rejected"}
                        value={item.description || ""}
                        onChange={(e) => {
                          const val = e.target.value
                          setApprovalItems(prev => prev.map((it, i) => i === idx ? { ...it, description: val } : it))
                        }}
                        className="h-10 w-full rounded-xl bg-zinc-50 border-zinc-100 font-medium text-xs disabled:opacity-50 px-3"
                      />
                    </div>

                    {/* Item-specific Images */}
                    {item.images && item.images.length > 0 && (
                      <div className="space-y-2 border-t border-zinc-100/60 pt-3">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Item Images ({item.images.length})</span>
                        <div className="flex flex-wrap gap-2">
                          {item.images.map((img: any, imgIdx: number) => {
                            const imgUrl = getImageUrl(img.filePath)
                            return (
                              <div
                                key={imgIdx}
                                onClick={() => setSelectedImage(imgUrl)}
                                title={img.fileName || `Attachment ${imgIdx + 1}`}
                                className="relative h-12 w-20 rounded-xl overflow-hidden border border-zinc-100 shadow-sm cursor-pointer group hover:scale-[1.03] transition-all bg-zinc-50"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Attachment ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Images Section */}
            {approvingIndent?.images && approvingIndent.images.length > 0 && (
              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Attached Images ({approvingIndent.images.length})</Label>
                <div className="grid grid-cols-3 gap-3">
                  {approvingIndent.images.map((img: any, idx: number) => {
                    const imgUrl = getImageUrl(img.filePath)
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        title={img.fileName || `Attachment ${idx + 1}`}
                        className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-100 shadow-sm cursor-pointer hover:scale-[1.03] transition-all bg-zinc-50 group"
                      >
                        <img
                          src={imgUrl}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Approval Description / Remark (Optional)</Label>
              <Textarea
                placeholder="e.g. Budget approved, specs verified, proceed with order..."
                value={approveRemark}
                onChange={(e) => setApproveRemark(e.target.value)}
                className="min-h-[100px] rounded-2xl bg-white border-zinc-100 focus:ring-emerald-500 focus:border-emerald-500 font-bold shadow-inner p-4 text-xs resize-none"
              />
            </div>
          </div>

          <div className="p-8 bg-emerald-50/20 border-t border-emerald-100 shrink-0 flex gap-4">
            <Button
              variant="outline"
              onClick={handleCancelApprove}
              className="flex-1 h-12 rounded-xl border-zinc-100 text-zinc-500 font-black text-xs hover:bg-zinc-50 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black text-xs gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
            >
              Confirm Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => { if (!open) setSelectedImage(null) }}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none bg-transparent shadow-none flex items-center justify-center">
          {selectedImage && (
            <div className="relative max-w-full max-h-[85vh] rounded-3xl overflow-hidden bg-black/95 p-1 flex items-center justify-center shadow-2xl">
              <img src={selectedImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
