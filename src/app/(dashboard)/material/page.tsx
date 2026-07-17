"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import {
  Box,
  Search,
  Scale,
  Loader2,
  Truck,
  CheckCircle,
  ClipboardList,
  RefreshCw,
  Eye,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { purchaseOrderService } from "@/service/purchaseOrderService"

export default function MaterialMasterPage() {
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  // Receive Dialog State
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<any | null>(null)
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({})
  const [isReceivingSubmit, setIsReceivingSubmit] = useState(false)

  // Issue Dialog State
  const [isIssueOpen, setIsIssueOpen] = useState(false)
  const [issueQuantities, setIssueQuantities] = useState<Record<string, number>>({})
  const [isIssuingSubmit, setIsIssuingSubmit] = useState(false)

  const fetchPurchaseOrders = async () => {
    setIsLoading(true)
    try {
      const response = await purchaseOrderService.getPurchaseOrders({ limit: 200, purchaseOrderType: "material" })
      const pos = response.data || []
      
      // Filter out POs that are Draft, PendingApproval, Rejected, or Cancelled
      // Only keep POs that are Approved, Ordered, PartiallyReceived, Received, or Issued
      const activePOs = pos.filter((po: any) =>
        ["Approved", "Ordered", "PartiallyReceived", "Received", "Issued", "Completed", "PendingVerification"].includes(po.status) &&
        po.purchaseOrderType === "material"
      )
      setPurchaseOrders(activePOs)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load Purchase Orders")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  // Filtered POs list based on search and status tabs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.projectId?.projectName || po.projectId?.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "PendingOrder" && po.status === "Approved") ||
        (statusFilter === "InTransit" && po.status === "Ordered") ||
        (statusFilter === "PartiallyReceived" && po.status === "PartiallyReceived") ||
        (statusFilter === "Received" && po.status === "Received") ||
        (statusFilter === "Issued" && po.status === "Issued")

      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, searchQuery, statusFilter])

  // Count helper for Approved POs
  const approvedPOCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "Approved").length
  }, [purchaseOrders])

  // Mark PO as Ordered
  const handleMarkOrdered = async (id: string) => {
    setIsProcessingAction(id)
    try {
      await purchaseOrderService.markPurchaseOrderOrdered(id)
      toast.success("Purchase Order marked as Ordered successfully")
      await fetchPurchaseOrders()
    } catch (err: any) {
      toast.error(err.message || "Failed to order materials")
    } finally {
      setIsProcessingAction(null)
    }
  }

  // Bulk Approve / Order All Approved POs
  const handleOrderAllApproved = async () => {
    const approvedPOs = purchaseOrders.filter((po) => po.status === "Approved")
    if (approvedPOs.length === 0) return

    setIsProcessingAction("bulk-order")
    let successCount = 0
    let failCount = 0

    try {
      for (const po of approvedPOs) {
        const poId = po._id || po.id
        if (poId) {
          try {
            await purchaseOrderService.markPurchaseOrderOrdered(poId)
            successCount++
          } catch (e) {
            failCount++
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully marked ${successCount} PO(s) as Ordered`)
      }
      if (failCount > 0) {
        toast.error(`Failed to process ${failCount} PO(s)`)
      }
      await fetchPurchaseOrders()
    } catch (err: any) {
      toast.error(err.message || "Bulk processing failed")
    } finally {
      setIsProcessingAction(null)
    }
  }

  // Open Receive Material Dialog
  const handleOpenReceive = (po: any) => {
    setSelectedPO(po)
    
    // Pre-populate receive quantities with remaining quantities to receive
    const initialQuantities: Record<string, number> = {}
    if (po.items && Array.isArray(po.items)) {
      po.items.forEach((item: any) => {
        const itemId = item.itemId?._id || item.itemId
        const remaining = (item.orderQuantity || 0) - (item.receivedQuantity || 0)
        initialQuantities[itemId] = Math.max(0, remaining)
      });
    }
    setReceiveQuantities(initialQuantities)
    setIsReceiveOpen(true)
  }

  // Submit Receive Quantities
  const handleReceiveSubmit = async () => {
    if (!selectedPO) return

    const itemsPayload = Object.entries(receiveQuantities)
      .map(([itemId, qty]) => ({
        itemId,
        receivedQuantity: Number(qty) || 0,
      }))
      .filter((item) => item.receivedQuantity > 0)

    if (itemsPayload.length === 0) {
      toast.error("Please enter a received quantity greater than 0 for at least one item.")
      return
    }

    setIsReceivingSubmit(true)
    try {
      const poId = selectedPO._id || selectedPO.id
      await purchaseOrderService.receivePurchaseOrderMaterial(poId, { items: itemsPayload })
      toast.success("Material receipt recorded successfully")
      setIsReceiveOpen(false)
      setSelectedPO(null)
      await fetchPurchaseOrders()
    } catch (err: any) {
      toast.error(err.message || "Failed to record material receipt")
    } finally {
      setIsReceivingSubmit(false)
    }
  }

  // Open Issue Material Dialog
  const handleOpenIssue = (po: any) => {
    setSelectedPO(po)
    
    // Pre-populate issue quantities with remaining received quantities to supply
    const initialQuantities: Record<string, number> = {}
    if (po.items && Array.isArray(po.items)) {
      po.items.forEach((item: any) => {
        const itemId = item.itemId?._id || item.itemId
        const remainingToIssue = (item.receivedQuantity || 0) - (item.issuedToRequesterQuantity || 0)
        initialQuantities[itemId] = Math.max(0, remainingToIssue)
      });
    }
    setIssueQuantities(initialQuantities)
    setIsIssueOpen(true)
  }

  // Submit Issue Quantities
  const handleIssueSubmit = async () => {
    if (!selectedPO) return

    const itemsPayload = Object.entries(issueQuantities)
      .map(([itemId, qty]) => ({
        itemId,
        supplyQuantity: Number(qty) || 0,
      }))
      .filter((item) => item.supplyQuantity > 0)

    if (itemsPayload.length === 0) {
      toast.error("Please enter a supply quantity greater than 0 for at least one item.")
      return
    }

    setIsIssuingSubmit(true)
    try {
      const poId = selectedPO._id || selectedPO.id
      await purchaseOrderService.issueMaterialToRequester(poId, { items: itemsPayload })
      toast.success("Materials issued to requester successfully")
      setIsIssueOpen(false)
      setSelectedPO(null)
      await fetchPurchaseOrders()
    } catch (err: any) {
      toast.error(err.message || "Failed to issue materials")
    } finally {
      setIsIssuingSubmit(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "poNo",
      header: "PO ID",
      cell: ({ row }) => (
        <div 
          onClick={() => router.push(`/purchase-order/${row.original._id || row.original.id}`)}
          className="font-bold text-teal-600 hover:underline cursor-pointer flex items-center gap-1.5"
        >
          <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
          {row.getValue("poNo")}
        </div>
      ),
    },
    {
      accessorKey: "projectId",
      header: "Project",
      cell: ({ row }) => (
        <div className="font-bold text-zinc-800">
          {row.original.projectId?.projectName || row.original.projectId?.name || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "vendorName",
      header: "Vendor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900">{row.original.vendorName}</span>
          <span className="text-[10px] text-zinc-400 font-medium">{row.original.vendorMobile || "No contact"}</span>
        </div>
      ),
    },
    {
      id: "materials",
      header: "Procured Items",
      cell: ({ row }) => {
        const items = row.original.items || []
        return (
          <div className="flex flex-col gap-1 max-w-xs">
            {items.slice(0, 3).map((item: any, i: number) => {
              const name = item.itemId?.itemName || item.itemId?.name || "Material"
              const unit = item.unitId?.unitName || item.unitId?.name || "Nos"
              return (
                <div key={i} className="text-[11px] font-bold text-zinc-500 truncate flex items-center justify-between border-b border-zinc-100/50 pb-0.5 last:border-none">
                  <span>{name}</span>
                  <span className="shrink-0 text-zinc-800 ml-2 font-extrabold">
                    {item.receivedQuantity || 0}/{item.orderQuantity} {unit}
                  </span>
                </div>
              )
            })}
            {items.length > 3 && (
              <span className="text-[9px] font-bold text-teal-600 uppercase mt-0.5">
                + {items.length - 3} more item(s)
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Lifecycle Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            className={cn(
              "px-3 py-1 rounded-full font-black text-[9px] gap-1.5 border-none shadow-sm uppercase tracking-wider",
              status === "Approved" ? "bg-blue-50 text-blue-700 hover:bg-blue-50" :
              status === "Ordered" ? "bg-amber-50 text-amber-700 hover:bg-amber-50" :
              status === "PartiallyReceived" ? "bg-teal-50 text-teal-700 hover:bg-teal-50" :
              status === "Received" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" :
              status === "Issued" ? "bg-purple-50 text-purple-700 hover:bg-purple-50" :
              "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current shrink-0" />
            {status === "Approved" ? "Approved (Pending Order)" :
             status === "Ordered" ? "Ordered (In-Transit)" :
             status === "PartiallyReceived" ? "Partially Received" :
             status === "Received" ? "Received (At Store)" :
             status === "Issued" ? "Issued (Completed)" :
             status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Action Hub</div>,
      cell: ({ row }) => {
        const po = row.original
        const id = po._id || po.id
        const isProcessing = isProcessingAction === id

        return (
          <div className="flex items-center justify-end gap-2 pr-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/material/${id}`)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-800 border-zinc-200 hover:bg-zinc-50 rounded-xl"
              title="View Material Ledger Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Material Master">
      <div className="flex flex-col gap-8 p-6 sm:p-12 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Control Hub */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">Material Receipts & Goods Inward</h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Goods Inward & Material Lifecycle Management</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64 shrink-0">
              <Input 
                placeholder="Search POs or vendors..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold text-sm shadow-sm" 
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>

            {approvedPOCount > 0 && (
              <Button 
                onClick={handleOrderAllApproved}
                disabled={isProcessingAction === "bulk-order"}
                className="h-11 rounded-xl px-5 font-black shadow-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition-all active:scale-95 duration-300"
              >
                {isProcessingAction === "bulk-order" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Order All Approved ({approvedPOCount})
              </Button>
            )}

            <Button 
              variant="outline"
              onClick={fetchPurchaseOrders}
              className="h-11 w-11 rounded-xl p-0 border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              title="Refresh ledger"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab-like Filters */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-px overflow-x-auto">
          {[
            { id: "All", label: "All POs" },
            { id: "PendingOrder", label: "Pending Order (Approved)" },
            { id: "InTransit", label: "In-Transit (Ordered)" },
            { id: "PartiallyReceived", label: "Partially Received" },
            { id: "Received", label: "Received (At Store)" },
            { id: "Issued", label: "Issued (Completed)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "h-10 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                statusFilter === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Board */}
        <div className="bg-white rounded-[2rem] border border-zinc-200/60 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 text-teal-600">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Ledger Inward Registry</h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
              <p className="text-zinc-500 font-bold text-sm">Loading procurement ledger...</p>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredPOs} />
          )}
        </div>

        {/* Dialog: Receive Material */}
        <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
          <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Box className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-150 shrink-0">
                  <Box className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Receive Material Goods</DialogTitle>
                  <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Record Goods Inward Registry
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedPO && (
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/20">
                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Purchase Order ID</span>
                      <span className="text-sm font-black text-zinc-900 mt-1">{selectedPO.poNo}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Vendor Name</span>
                      <span className="text-sm font-black text-zinc-900 mt-1 truncate">{selectedPO.vendorName}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inward Quantity Grid</Label>
                  <div className="border border-zinc-150 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Material</th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Ordered</th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Received</th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right pr-6 w-32">Receiving Now</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {selectedPO.items?.map((item: any, idx: number) => {
                          const itemId = item.itemId?._id || item.itemId
                          const name = item.itemId?.itemName || item.itemId?.name || "Material"
                          const unit = item.unitId?.unitName || item.unitId?.name || "Nos"
                          const remaining = (item.orderQuantity || 0) - (item.receivedQuantity || 0)

                          return (
                            <tr key={idx}>
                              <td className="px-4 py-4 text-xs font-bold text-zinc-800">{name}</td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.orderQuantity} {unit}
                              </td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.receivedQuantity || 0} {unit}
                              </td>
                              <td className="px-4 py-4 text-right pr-6 w-32">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remaining}
                                    value={receiveQuantities[itemId] !== undefined ? receiveQuantities[itemId] : remaining}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(remaining, Number(e.target.value) || 0))
                                      setReceiveQuantities(prev => ({
                                        ...prev,
                                        [itemId]: val
                                      }))
                                    }}
                                    disabled={remaining <= 0}
                                    className="h-9 w-24 text-right rounded-lg bg-zinc-50 border-zinc-200 font-bold text-xs pr-7 disabled:bg-zinc-100"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 pointer-events-none">
                                    {unit}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsReceiveOpen(false)
                      setSelectedPO(null)
                    }}
                    className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleReceiveSubmit}
                    disabled={isReceivingSubmit}
                    className="h-14 flex-1 rounded-2xl bg-teal-600 text-white font-black shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isReceivingSubmit ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Recording...
                      </>
                    ) : (
                      <>
                        <Scale className="h-5 w-5" /> Save Inward Receipt
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog: Issue Material */}
        <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
          <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Box className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Issue Material to Requester</DialogTitle>
                  <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Supply Inward Stock to Requester
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedPO && (
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/20">
                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Purchase Order ID</span>
                      <span className="text-sm font-black text-zinc-900 mt-1">{selectedPO.poNo}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Requester / Project</span>
                      <span className="text-sm font-black text-zinc-900 mt-1 truncate">
                        {selectedPO.requesterId?.name || "Requester"} ({selectedPO.projectId?.projectName || selectedPO.projectId?.name || "N/A"})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Supply Quantity Grid</Label>
                  <div className="border border-zinc-150 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Material</th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Received</th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Already Issued</th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right pr-6 w-32">Supplying Now</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {selectedPO.items?.map((item: any, idx: number) => {
                          const itemId = item.itemId?._id || item.itemId
                          const name = item.itemId?.itemName || item.itemId?.name || "Material"
                          const unit = item.unitId?.unitName || item.unitId?.name || "Nos"
                          const remainingToIssue = (item.receivedQuantity || 0) - (item.issuedToRequesterQuantity || 0)

                          return (
                            <tr key={idx}>
                              <td className="px-4 py-4 text-xs font-bold text-zinc-800">{name}</td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.receivedQuantity || 0} {unit}
                              </td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.issuedToRequesterQuantity || 0} {unit}
                              </td>
                              <td className="px-4 py-4 text-right pr-6 w-32">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remainingToIssue}
                                    value={issueQuantities[itemId] !== undefined ? issueQuantities[itemId] : remainingToIssue}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(remainingToIssue, Number(e.target.value) || 0))
                                      setIssueQuantities(prev => ({
                                        ...prev,
                                        [itemId]: val
                                      }))
                                    }}
                                    disabled={remainingToIssue <= 0}
                                    className="h-9 w-24 text-right rounded-lg bg-zinc-50 border-zinc-200 font-bold text-xs pr-7 disabled:bg-zinc-100"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 pointer-events-none">
                                    {unit}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsIssueOpen(false)
                      setSelectedPO(null)
                    }}
                    className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleIssueSubmit}
                    disabled={isIssuingSubmit}
                    className="h-14 flex-1 rounded-2xl bg-purple-600 text-white font-black shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isIssuingSubmit ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Supplying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" /> Confirm Issue Supply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </ContentLayout>
  )
}
