"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Loader2, Search, Plus, Eye, CheckCircle2, AlertCircle, Building2, Truck } from "lucide-react"
import { assetSiteTransferService, CreateAssetTransferPayload } from "@/service/assetSiteTransfer.api"
import { projectService, ApiProject } from "@/service/projectService"
import { assetService, ApiAsset } from "@/service/assets.api"
import { userService, ApiUser } from "@/service/userService"
import { vendorService, ApiVendor } from "@/service/vendorService"
import { useAuthStore } from "@/store/use-auth-store"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function AssetSiteTransfersPage() {
  const currentUser = useAuthStore((state) => state.user)

  const [transfers, setTransfers] = useState<any[]>([])
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [assets, setAssets] = useState<ApiAsset[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])
  const [vendors, setVendors] = useState<ApiVendor[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [transferToConfirm, setTransferToConfirm] = useState<any | null>(null)
  const [isConfirmReceiptOpen, setIsConfirmReceiptOpen] = useState(false)
  const [transferToReject, setTransferToReject] = useState<any | null>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Create form state
  const [destinationType, setDestinationType] = useState<"site" | "vendor">("site")
  const [fromProjectId, setFromProjectId] = useState("")
  const [toProjectId, setToProjectId] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [recipientUserId, setRecipientUserId] = useState("")
  const [assetId, setAssetId] = useState("")
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = useMemo(() => {
    const role = currentUser?.roleId
    const roleName = String(typeof role === "object" ? role?.name : role || "").toLowerCase()
    const roleScope = typeof role === "object" ? role?.scope : undefined
    return roleScope === "organization" || ["admin", "superadmin", "super admin"].includes(roleName)
  }, [currentUser])

  const fetchTransfers = useCallback(async () => {
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
  }, [])

  const fetchDependencies = useCallback(async () => {
    try {
      const [projRes, assetRes, userRes, vendorRes] = await Promise.all([
        projectService.getProjects({ limit: 500 }),
        assetService.getAssets({ limit: 500 }),
        userService.getUsers({ limit: 500, status: "active" }),
        vendorService.getVendors({ limit: 500, status: "active" }),
      ])
      setProjects(projRes.projects || [])
      setAssets(Array.isArray(assetRes) ? assetRes : assetRes?.data || [])
      setUsers(userRes.data || [])
      setVendors(vendorRes.vendors || [])
    } catch (err) {
      console.error("Error loading dependency data:", err)
    }
  }, [])

  useEffect(() => {
    fetchTransfers()
    fetchDependencies()
  }, [fetchTransfers, fetchDependencies])

  const resetCreateForm = () => {
    setDestinationType("site")
    setFromProjectId("")
    setToProjectId("")
    setVendorId("")
    setRecipientUserId("")
    setAssetId("")
    setFromLocation("")
    setToLocation("")
    setNotes("")
  }

  const eligibleAssets = useMemo(() => {
    if (!fromProjectId) return assets
    return assets.filter((a) => {
      const pId = typeof a.projectId === "object" ? (a.projectId as any)?._id : a.projectId
      return !pId || String(pId) === fromProjectId
    })
  }, [assets, fromProjectId])

  const isFormValid = useMemo(() => {
    if (!fromProjectId || !assetId) return false

    if (destinationType === "site") {
      if (!toProjectId || !recipientUserId) return false
      if (toProjectId === fromProjectId) return false
    } else {
      if (!vendorId) return false
    }
    return true
  }, [destinationType, fromProjectId, toProjectId, vendorId, recipientUserId, assetId])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      toast.error("Please fill all required fields correctly.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateAssetTransferPayload = {
        destinationType,
        fromProjectId,
        assetId,
        fromLocation: fromLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      if (destinationType === "site") {
        payload.toProjectId = toProjectId
        payload.recipientUserId = recipientUserId
        payload.toLocation = toLocation.trim() || undefined
      } else {
        payload.vendorId = vendorId
        if (recipientUserId) {
          payload.recipientUserId = recipientUserId
        }
      }

      const res = await assetSiteTransferService.createTransfer(payload)
      toast.success(res?.message || "Asset Site Transfer created successfully")
      setIsCreateOpen(false)
      resetCreateForm()
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.message || "Failed to create transfer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (id: string) => {
    setIsActionLoading(true)
    try {
      const res = await assetSiteTransferService.approveTransfer(id)
      toast.success("Transfer approved successfully")
      if (selectedTransfer?._id === id) {
        setSelectedTransfer(res.data || null)
      }
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.message || "Failed to approve transfer")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!transferToReject?._id) return
    setIsActionLoading(true)
    try {
      await assetSiteTransferService.rejectTransfer(transferToReject._id, rejectReason.trim() || undefined)
      toast.success("Transfer rejected successfully")
      setIsRejectOpen(false)
      setTransferToReject(null)
      setRejectReason("")
      if (selectedTransfer?._id === transferToReject._id) {
        setIsDetailOpen(false)
        setSelectedTransfer(null)
      }
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.message || "Failed to reject transfer")
    } finally {
      setIsActionLoading(false)
    }
  }

  const canUserConfirmReceipt = (transfer: any) => {
    if (!transfer || !currentUser?._id) return false
    if (transfer.status !== "Approved") return false
    if (transfer.recipientStatus !== "Pending") return false
    const recipientId = typeof transfer.recipientUserId === "object" ? transfer.recipientUserId?._id : transfer.recipientUserId
    return String(recipientId || "") === String(currentUser._id)
  }

  const handleConfirmReceipt = async () => {
    if (!transferToConfirm?._id) return
    setIsActionLoading(true)
    try {
      const res = await assetSiteTransferService.confirmReceipt(transferToConfirm._id)
      toast.success(res?.message || "Asset receipt confirmed successfully")
      setIsConfirmReceiptOpen(false)
      setTransferToConfirm(null)
      if (selectedTransfer?._id === transferToConfirm._id) {
        setSelectedTransfer(res?.data || null)
      }
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm receipt")
    } finally {
      setIsActionLoading(false)
    }
  }

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const searchLower = searchQuery.toLowerCase()
      const assetName = t.assetId?.name || t.assetId?.assetName || ""
      const serialNum = t.assetId?.serialNumber || ""
      const fromProject = t.fromProjectId?.projectName || t.fromProjectId?.name || ""
      const toProject = t.toProjectId?.projectName || t.toProjectId?.name || ""
      const vendorName = t.vendorId?.companyName || t.vendorId?.name || ""
      const receiverName = t.recipientUserId?.name || ""
      const notesText = t.notes || ""

      return (
        assetName.toLowerCase().includes(searchLower) ||
        serialNum.toLowerCase().includes(searchLower) ||
        fromProject.toLowerCase().includes(searchLower) ||
        toProject.toLowerCase().includes(searchLower) ||
        vendorName.toLowerCase().includes(searchLower) ||
        receiverName.toLowerCase().includes(searchLower) ||
        notesText.toLowerCase().includes(searchLower)
      )
    })
  }, [transfers, searchQuery])

  const renderApprovalChip = (status: string) => {
    const s = status || "Pending"
    if (s === "Approved") {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          Approved
        </span>
      )
    }
    if (s === "Rejected") {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          Rejected
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        Pending
      </span>
    )
  }

  const renderReceiptChip = (transfer: any) => {
    const status = transfer.recipientStatus || (transfer.recipientUserId ? "Pending" : "NotRequired")
    if (status === "Accepted") {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
          Received
        </span>
      )
    }
    if (status === "Pending") {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          Receiver pending
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-zinc-50 text-zinc-600 border border-zinc-200">
        No receiver required
      </span>
    )
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset",
      cell: ({ row }) => {
        const asset = row.original.assetId
        const name = asset?.name || asset?.assetName || "Unknown Asset"
        const serial = asset?.serialNumber
        const type = asset?.type
        return (
          <div>
            <div className="font-bold text-zinc-900">{name}</div>
            <div className="text-xs text-zinc-500">
              {type || "Asset"} {serial ? `· ${serial}` : ""}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "fromProject",
      header: "From Project",
      cell: ({ row }) => (
        <span className="text-sm text-zinc-700">
          {row.original.fromProjectId?.projectName || row.original.fromProjectId?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "destination",
      header: "Destination",
      cell: ({ row }) => {
        const t = row.original
        const isVendor = t.destinationType === "vendor" || (!t.toProjectId && t.vendorId)
        if (isVendor) {
          const vName = t.vendorId?.companyName || t.vendorId?.name || "Vendor"
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700">
                <Truck className="w-3 h-3" /> Vendor
              </span>
              <span className="text-sm font-medium text-zinc-800">{vName}</span>
            </div>
          )
        }
        const siteName = t.toProjectId?.projectName || t.toProjectId?.name || "N/A"
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
              <Building2 className="w-3 h-3" /> Site
            </span>
            <span className="text-sm font-medium text-zinc-800">{siteName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "recipientUserId",
      header: "Receiver",
      cell: ({ row }) => {
        const user = row.original.recipientUserId
        if (!user) {
          return <span className="text-xs text-zinc-400 italic">None</span>
        }
        return (
          <div className="text-sm">
            <div className="font-medium text-zinc-800">{user.name || "Assigned User"}</div>
            {user.email && <div className="text-xs text-zinc-500">{user.email}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-xs text-zinc-600 max-w-xs truncate block">{row.original.notes || "-"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Approval",
      cell: ({ row }) => renderApprovalChip(row.original.status),
    },
    {
      accessorKey: "recipientStatus",
      header: "Receipt",
      cell: ({ row }) => renderReceiptChip(row.original),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const t = row.original
        const isEligibleReceiver = canUserConfirmReceipt(t)
        const isPending = (t.status || "Pending") === "Pending"

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTransfer(t)
                setIsDetailOpen(true)
              }}
              className="h-8 px-2.5 text-xs text-zinc-700"
            >
              <Eye className="w-3.5 h-3.5 mr-1" /> View
            </Button>

            {isAdmin && isPending && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(t._id)}
                  disabled={isActionLoading}
                  className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setTransferToReject(t)
                    setRejectReason("")
                    setIsRejectOpen(true)
                  }}
                  disabled={isActionLoading}
                  className="h-8 px-2.5 text-xs font-semibold"
                >
                  Reject
                </Button>
              </>
            )}

            {isEligibleReceiver && (
              <Button
                size="sm"
                onClick={() => {
                  setTransferToConfirm(t)
                  setIsConfirmReceiptOpen(true)
                }}
                disabled={isActionLoading}
                className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm receipt
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Asset Site Transfers">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Asset Site Transfers</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              Create, track, approve, and confirm delivery of asset equipment transfers between sites and vendors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetCreateForm()
                setIsCreateOpen(true)
              }}
              className="font-bold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Asset Transfer
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72 shrink-0">
            <Input
              placeholder="Search transfers, assets, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl bg-white border-zinc-200 pl-10 font-medium text-sm shadow-sm"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
              <p className="text-zinc-500 font-bold text-xs">Loading asset transfers...</p>
            </div>
          ) : (
            <div className="p-4">
              <DataTable columns={columns} data={filteredTransfers} />
            </div>
          )}
        </div>
      </div>

      {/* CREATE ASSET TRANSFER DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Asset Transfer Request</DialogTitle>
            <DialogDescription>
              Submit an equipment transfer request. Site destinations require destination project and receiver employee.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {/* Destination Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Destination Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDestinationType("site")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                    destinationType === "site"
                      ? "border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/20"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Site Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setDestinationType("vendor")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                    destinationType === "vendor"
                      ? "border-purple-600 bg-purple-50/70 text-purple-800 ring-2 ring-purple-500/20"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <Truck className="w-4 h-4" /> Vendor Transfer
                </button>
              </div>
            </div>

            {/* Source Project */}
            <div className="space-y-1.5">
              <Label htmlFor="assetFromProject" className="text-xs font-bold text-zinc-700">
                Source Project (From) *
              </Label>
              <select
                id="assetFromProject"
                value={fromProjectId}
                onChange={(e) => {
                  setFromProjectId(e.target.value)
                  if (toProjectId === e.target.value) setToProjectId("")
                  setAssetId("")
                }}
                className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select source project</option>
                {projects.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.projectName || (p as any).name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="selectedAsset" className="text-xs font-bold text-zinc-700">
                Asset *
              </Label>
              <select
                id="selectedAsset"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select asset</option>
                {eligibleAssets.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.type}) {a.serialNumber ? `· S/N: ${a.serialNumber}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Site Specific Fields */}
            {destinationType === "site" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-blue-50/40 border border-blue-100">
                <div className="space-y-1.5">
                  <Label htmlFor="assetToProject" className="text-xs font-bold text-blue-950">
                    Destination Project (To) *
                  </Label>
                  <select
                    id="assetToProject"
                    value={toProjectId}
                    onChange={(e) => setToProjectId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select destination project</option>
                    {projects
                      .filter((p) => (p._id || p.id) !== fromProjectId)
                      .map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.projectName || (p as any).name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assetRecipientUser" className="text-xs font-bold text-blue-950">
                    Receiver Employee *
                  </Label>
                  <select
                    id="assetRecipientUser"
                    value={recipientUserId}
                    onChange={(e) => setRecipientUserId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select receiving user</option>
                    {users.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Vendor Specific Fields */}
            {destinationType === "vendor" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-purple-50/40 border border-purple-100">
                <div className="space-y-1.5">
                  <Label htmlFor="assetVendor" className="text-xs font-bold text-purple-950">
                    Destination Vendor *
                  </Label>
                  <select
                    id="assetVendor"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v._id || v.id} value={v._id || v.id}>
                        {v.companyName || v.name} {v.vendorCode ? `(${v.vendorCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assetVendorRecipientUser" className="text-xs font-bold text-purple-950">
                    Receiver Employee (Optional)
                  </Label>
                  <select
                    id="assetVendorRecipientUser"
                    value={recipientUserId}
                    onChange={(e) => setRecipientUserId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">None (No receiver confirmation needed)</option>
                    {users.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Locations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assetFromLocation" className="text-xs font-bold text-zinc-700">
                  From Location (Optional)
                </Label>
                <Input
                  id="assetFromLocation"
                  placeholder="e.g. Tower A Store"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="h-9"
                />
              </div>
              {destinationType === "site" && (
                <div className="space-y-1.5">
                  <Label htmlFor="assetToLocation" className="text-xs font-bold text-zinc-700">
                    To Location (Optional)
                  </Label>
                  <Input
                    id="assetToLocation"
                    placeholder="e.g. Tower B Store"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="assetNotes" className="text-xs font-bold text-zinc-700">
                Notes (Optional)
              </Label>
              <Textarea
                id="assetNotes"
                placeholder="Reason or instructions for equipment transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting} className="font-bold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Create Transfer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Asset Transfer Details</DialogTitle>
            <DialogDescription>Review asset transfer request and delivery status</DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4 text-sm pt-2">
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <div className="text-xs text-zinc-500 font-semibold">Asset</div>
                <div className="font-bold text-zinc-900 text-base">
                  {selectedTransfer.assetId?.name || selectedTransfer.assetId?.assetName || "Unknown Asset"}
                </div>
                <div className="text-xs text-zinc-600 mt-0.5">
                  Type: {selectedTransfer.assetId?.type || "Asset"}
                  {selectedTransfer.assetId?.serialNumber ? ` · S/N: ${selectedTransfer.assetId.serialNumber}` : ""}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 font-semibold">Source (From)</div>
                  <div className="font-medium text-zinc-800">
                    {selectedTransfer.fromProjectId?.projectName || selectedTransfer.fromProjectId?.name || "N/A"}
                  </div>
                  {selectedTransfer.fromLocation && (
                    <div className="text-xs text-zinc-500">Loc: {selectedTransfer.fromLocation}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-semibold">Destination (To)</div>
                  <div className="font-medium text-zinc-800">
                    {selectedTransfer.destinationType === "vendor" || (!selectedTransfer.toProjectId && selectedTransfer.vendorId)
                      ? selectedTransfer.vendorId?.companyName || selectedTransfer.vendorId?.name || "Vendor"
                      : selectedTransfer.toProjectId?.projectName || selectedTransfer.toProjectId?.name || "N/A"}
                  </div>
                  {selectedTransfer.toLocation && (
                    <div className="text-xs text-zinc-500">Loc: {selectedTransfer.toLocation}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                <div>
                  <div className="text-xs text-zinc-500 font-semibold mb-1">Approval Status</div>
                  {renderApprovalChip(selectedTransfer.status)}
                  {selectedTransfer.approvedAt && (
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Approved: {new Date(selectedTransfer.approvedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedTransfer.rejectReason && (
                    <div className="text-xs text-rose-600 mt-1 font-medium">
                      Reason: {selectedTransfer.rejectReason}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-semibold mb-1">Receipt Status</div>
                  {renderReceiptChip(selectedTransfer)}
                  {selectedTransfer.recipientAcceptedAt && (
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Received: {new Date(selectedTransfer.recipientAcceptedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="text-xs text-zinc-500 font-semibold">Receiver Employee</div>
                <div className="font-medium text-zinc-800">
                  {selectedTransfer.recipientUserId?.name || "No receiver assigned"}
                </div>
                {selectedTransfer.recipientUserId?.email && (
                  <div className="text-xs text-zinc-500">{selectedTransfer.recipientUserId.email}</div>
                )}
              </div>

              {selectedTransfer.notes && (
                <div>
                  <div className="text-xs text-zinc-500 font-semibold">Notes</div>
                  <div className="text-xs text-zinc-700 bg-zinc-50 p-2 rounded border border-zinc-200">
                    {selectedTransfer.notes}
                  </div>
                </div>
              )}

              {/* Action buttons inside details modal */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                {isAdmin && selectedTransfer.status === "Pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(selectedTransfer._id)}
                      disabled={isActionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setTransferToReject(selectedTransfer)
                        setRejectReason("")
                        setIsRejectOpen(true)
                      }}
                      disabled={isActionLoading}
                      className="font-semibold"
                    >
                      Reject
                    </Button>
                  </>
                )}

                {canUserConfirmReceipt(selectedTransfer) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setTransferToConfirm(selectedTransfer)
                      setIsConfirmReceiptOpen(true)
                    }}
                    disabled={isActionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Confirm Receipt
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM RECEIPT DIALOG */}
      <Dialog open={isConfirmReceiptOpen} onOpenChange={setIsConfirmReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Confirm receipt
            </DialogTitle>
            <DialogDescription className="pt-2 text-zinc-700 text-sm">
              Have you received this asset at the destination?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmReceiptOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReceipt}
              disabled={isActionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Yes, received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT CONFIRMATION DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" /> Reject Asset Transfer Request
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-sm">
              Please enter the reason for rejecting this transfer request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="assetRejectReasonText" className="text-xs font-semibold text-zinc-700">
              Rejection Reason (Optional)
            </Label>
            <Textarea
              id="assetRejectReasonText"
              placeholder="e.g. Asset required for ongoing project tasks"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isActionLoading}
              className="font-bold"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
