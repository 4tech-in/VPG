"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  Calendar, 
  Clock, 
  FileText, 
  Box, 
  Check, 
  MessageSquare, 
  FileQuestion, 
  ShieldCheck, 
  Trash2, 
  Copy, 
  ChevronDown, 
  User, 
  Phone, 
  MapPin, 
  FolderOpen,
  Truck,
  DollarSign,
  UserCheck,
  Building,
  Loader2
} from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { purchaseOrderService } from "@/service/purchaseOrderService"
import { exportPurchaseOrderReceipt } from "@/lib/export-receipt"
import { toast } from "sonner"

export default function PODetailPage() {
  const params = useParams()
  const router = useRouter()
  const [po, setPo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      setIsLoading(true)
      purchaseOrderService.getPurchaseOrderById(params.id as string)
        .then(res => {
          setPo(res)
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [params.id])

  if (isLoading) {
    return (
      <ContentLayout title="Loading Purchase Order...">
        <div className="flex flex-col items-center justify-center py-20 gap-2 min-h-screen">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 font-bold text-xs">Loading purchase order details...</p>
        </div>
      </ContentLayout>
    )
  }

  if (!po) {
    return (
      <ContentLayout title="Purchase Order Not Found">
        <div className="flex flex-col items-center justify-center py-20 gap-2 min-h-screen">
          <p className="text-zinc-500 font-bold text-xs">Purchase order details could not be found.</p>
          <Button size="sm" onClick={() => router.push("/purchase-order")}>Go Back</Button>
        </div>
      </ContentLayout>
    )
  }

  const items = po.items || []
  
  // Calculations
  const calculatedSubtotal = items.reduce((sum: number, item: any) => {
    const qty = item.orderQuantity || item.indentQuantity || 0
    const rate = item.rate || 0
    return sum + (qty * rate)
  }, 0)

  const getInitials = (name: string) => {
    if (!name) return "VD"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Days left calculation
  const getDaysLeft = () => {
    if (!po.expectedDeliveryDate) return "N/A"
    const diffTime = new Date(po.expectedDeliveryDate).getTime() - new Date().getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return "Delivered / Overdue"
    return `${diffDays} Days Left`
  }

  // Validity Period Duration Calculation
  const getValidityDays = () => {
    if (!po.validFrom || !po.validTo) return "N/A"
    const diffTime = new Date(po.validTo).getTime() - new Date(po.validFrom).getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} Days`
  }

  const handleCancelPO = async () => {
    if (confirm("Are you sure you want to cancel this purchase order?")) {
      try {
        await purchaseOrderService.cancelPurchaseOrder(po._id || po.id)
        toast.success("Purchase order cancelled successfully")
        router.push("/purchase-order")
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel Purchase Order")
      }
    }
  }

  return (
    <ContentLayout title={`Purchase Order Detail: ${po.poNo || "N/A"}`}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1500px] mx-auto min-h-screen bg-zinc-50/45">
        
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center gap-1 text-zinc-500 text-[11px] font-bold hover:text-zinc-800 transition-colors">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/purchase-order")}
            className="h-7 px-2 rounded-md text-zinc-500 font-bold hover:bg-zinc-100 flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Purchase Order</span>
          </Button>
        </div>

        {/* PO Header Title Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-zinc-950 tracking-tight">{po.poNo || "N/A"}</h1>
              <Badge className={cn(
                "rounded-md px-2.5 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider pointer-events-none gap-1",
                po.status === "Draft" && "bg-zinc-100 text-zinc-600 border-zinc-200",
                po.status === "PendingApproval" && "bg-amber-50 text-amber-600 border-amber-100",
                po.status === "Approved" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                po.status === "Rejected" && "bg-rose-50 text-rose-600 border-rose-100",
                po.status === "Ordered" && "bg-indigo-50 text-indigo-600 border-indigo-100",
                po.status === "PartiallyReceived" && "bg-orange-50 text-orange-600 border-orange-100",
                po.status === "Received" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                po.status === "Issued" && "bg-teal-50 text-teal-600 border-teal-100",
                po.status === "Cancelled" && "bg-zinc-50 text-zinc-400 border-zinc-150"
              )}>
                <span className="h-1 w-1 rounded-full bg-current" />
                {po.status || "Draft"}
              </Badge>
            </div>

            {/* Sub-Header Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-zinc-400" />
                <span>Project: <strong className="text-zinc-600">{po.projectId?.projectName || po.projectId?.name || "N/A"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                <span>Vendor: <strong className="text-zinc-600">{po.vendorName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>Created: <strong className="text-zinc-600">
                  {po.createdAt ? `${new Date(po.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} • ${new Date(po.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "N/A"}
                </strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons Top Right */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => exportPurchaseOrderReceipt(po)} 
              variant="outline" 
              className="h-9 rounded-lg border-zinc-200 font-bold text-[11px] gap-1.5 px-4 shadow-sm bg-white hover:bg-zinc-50"
            >
              <Printer className="h-3.5 w-3.5 text-zinc-500" /> Print
            </Button>
            <Button 
              onClick={() => exportPurchaseOrderReceipt(po)} 
              variant="outline" 
              className="h-9 rounded-lg border-zinc-200 font-bold text-[11px] gap-1.5 px-4 shadow-sm bg-white hover:bg-zinc-50"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" /> Download PDF
            </Button>
            <Button 
              className="h-9 rounded-lg font-bold text-[11px] gap-1.5 px-4 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            >
              <Share2 className="h-3.5 w-3.5" /> Share <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </Button>
          </div>
        </div>

        {/* 5-Column Core Dashboard Summary Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { 
              label: "Order Date", 
              val: po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A", 
              sub: po.createdAt ? new Date(po.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
              icon: Calendar, 
              color: "text-emerald-500", 
              bg: "bg-emerald-50" 
            },
            { 
              label: "Expected Delivery", 
              val: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A", 
              sub: getDaysLeft(),
              subColor: "text-blue-500",
              icon: Truck, 
              color: "text-blue-500", 
              bg: "bg-blue-50" 
            },
            { 
              label: "Validity Period", 
              val: po.validFrom && po.validTo ? `${new Date(po.validFrom).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(po.validTo).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "N/A", 
              sub: getValidityDays(),
              icon: Clock, 
              color: "text-purple-500", 
              bg: "bg-purple-50" 
            },
            { 
              label: "Indent Reference", 
              val: po.indentId?.indentId || po.indentId?.indentNo || "N/A", 
              sub: po.indentId?.status ? po.indentId.status.replace(/([A-Z])/g, " $1").trim() : "Converted to PO",
              icon: FileText, 
              color: "text-amber-500", 
              bg: "bg-amber-50" 
            },
            { 
              label: "Total Amount", 
              val: `₹ ${Number(po.totalAmount || 0).toLocaleString("en-IN")}`, 
              sub: "Grand Total",
              subColor: "text-emerald-600 font-bold",
              icon: DollarSign, 
              color: "text-emerald-600", 
              bg: "bg-emerald-50" 
            },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-sm flex flex-col justify-between min-h-[90px] gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">{card.label}</span>
                <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", card.bg)}>
                  <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-zinc-900 tracking-tight">{card.val}</span>
                {card.sub && (
                  <span className={cn("text-[9px] font-bold", card.subColor || "text-zinc-400")}>
                    {card.sub}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,330px] gap-6">
          
          {/* LEFT AREA: Material, Remarks, Governance, Approval Timeline */}
          <div className="space-y-6">
            
            {/* Material List Card */}
            <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                    <Box className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Material List</h4>
                </div>
                <Badge className="bg-zinc-100 hover:bg-zinc-100 text-zinc-600 font-bold text-[9px] px-2.5 py-0.5 rounded-md border border-zinc-200">
                  {items.length} Item(s)
                </Badge>
              </div>

              {/* Material List Table */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-250">
                      <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Material List</th>
                      <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Ordered Qty</th>
                      <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center font-bold">Unit</th>
                      <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/50">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="group hover:bg-zinc-50/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-teal-500 group-hover:text-white transition-all shrink-0 border border-zinc-200">
                              <Box className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-black text-zinc-900 tracking-tight">{item.itemId?.itemName || item.itemId?.name || "Material"}</span>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">ID: {item.itemId?._id ? item.itemId._id.slice(-6).toUpperCase() : "N/A"}</span>
                              <span className="text-[9px] font-semibold text-zinc-400 mt-0.5">Specification: <span className="text-zinc-600 font-bold">{item.specification || "N/A"}</span></span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-zinc-100 px-2.5 py-0.5 rounded text-[11px] font-black text-zinc-700 min-w-6 text-center">{item.orderQuantity || item.indentQuantity}</span>
                            <span className="text-[9px] text-zinc-400 font-semibold">Received: <strong className="text-zinc-650 font-bold">{item.receivedQuantity || 0}</strong></span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] font-black text-zinc-800 tracking-tight">{item.unitId?.name || "Nos"}</span>
                            <span className="text-[9px] text-zinc-400 font-semibold">Rate: <span className="text-zinc-700 font-bold font-black">₹{Number(item.rate || 0).toLocaleString("en-IN")}</span></span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end gap-1.5 pr-1">
                            <span className="text-xs font-black text-zinc-900">₹{Number(item.amount || ((item.orderQuantity || item.indentQuantity) * (item.rate || 0))).toLocaleString("en-IN")}</span>
                            <Badge className="bg-amber-100/50 hover:bg-amber-100/50 text-amber-700 border-none px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
                              Pending
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks & Notes Card row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Order Remarks</h4>
                </div>
                <div className="bg-emerald-50/20 p-4 rounded-lg border border-emerald-100/30 italic text-xs font-bold text-emerald-800 leading-relaxed relative">
                  <span className="text-3xl text-emerald-200/60 font-black absolute top-0.5 left-2 pointer-events-none">&ldquo;</span>
                  <p className="pl-5 relative z-10">{po.remark || "No remarks provided"}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FileQuestion className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Terms & Notes</h4>
                </div>
                {po.notes ? (
                  <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-150/50 text-[11px] font-semibold text-zinc-650 leading-relaxed">
                    {po.notes}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      "Delivery to the designated project location.",
                      "Verification of quality on site arrival.",
                      "Standard processing times as per organizational policy."
                    ].map((term, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-[9px] font-black shrink-0 border border-emerald-100">{i+1}</span>
                        <p className="text-[11px] font-bold text-zinc-600 mt-0.5 leading-relaxed">{term}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Approval Workflow Timeline Card */}
            <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Approval Workflow</h4>
              </div>

              {/* Horizontal Timeline */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2 pb-1 px-2 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-[22px] left-[10%] right-[10%] h-0.5 bg-zinc-200 -z-0" />
                
                {/* Step 1: PO Created */}
                <div className="flex flex-col items-center text-center gap-1.5 relative z-10 shrink-0">
                  <div className="h-9 w-9 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white shadow-sm">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-zinc-900">PO Created</span>
                    <span className="text-[9px] font-bold text-zinc-400">Initiated by {po.createdBy?.name || "N/A"}</span>
                    <span className="text-[8px] font-bold text-zinc-400">
                      {po.createdAt ? `${new Date(po.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${new Date(po.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Step 2: Approved status check */}
                <div className="flex flex-col items-center text-center gap-1.5 relative z-10 shrink-0">
                  <div className={cn(
                    "h-9 w-9 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm",
                    po.status === "Approved" || po.status === "Ordered" || po.status === "Received" || po.status === "PartiallyReceived" || po.status === "Issued"
                      ? "bg-blue-500"
                      : "bg-zinc-300"
                  )}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-zinc-900">Approved</span>
                    <span className="text-[9px] font-bold text-zinc-400">Authorized by {po.approvedBy?.name || "N/A"}</span>
                    <span className="text-[8px] font-bold text-zinc-400">
                      {po.approvedAt ? `${new Date(po.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${new Date(po.approvedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Step 3: Completed state check */}
                <div className="flex flex-col items-center text-center gap-1.5 relative z-10 shrink-0">
                  <div className={cn(
                    "h-9 w-9 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm",
                    po.status === "Received" || po.status === "Issued"
                      ? "bg-emerald-500"
                      : po.status === "Approved" || po.status === "Ordered" || po.status === "PartiallyReceived"
                        ? "bg-emerald-500" // also completed PO approval
                        : "bg-zinc-300"
                  )}>
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-zinc-900">Completed</span>
                    <span className="text-[9px] font-bold text-zinc-400">PO Approved</span>
                    <span className="text-[8px] font-bold text-zinc-400">
                      {po.approvedAt ? `${new Date(po.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${new Date(po.approvedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Governance and Attachments dual panel */}
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr,1.3fr] gap-6">
              
              {/* Governance Details */}
              <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Governance</h4>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { label: "Requested By", val: po.requesterId ? `${po.requesterId.name} (${po.requesterId.email})` : "N/A" },
                    { label: "Created By", val: po.createdBy ? `${po.createdBy.name} (${po.createdBy.email})` : "N/A" },
                    { label: "Approved By", val: po.approvedBy ? `${po.approvedBy.name} (${po.approvedBy.email})` : "N/A" },
                    { 
                      label: "Approved At", 
                      val: po.approvedAt ? `${new Date(po.approvedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} • ${new Date(po.approvedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "N/A" 
                    },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] border-b border-zinc-150/40 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-bold text-zinc-400">{row.label}</span>
                      <span className="font-black text-zinc-800 text-right max-w-[70%] truncate leading-normal" title={row.val}>{row.val}</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center text-[11px] pt-2 border-t border-zinc-100">
                    <span className="font-bold text-zinc-400">Approval Level</span>
                    <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase">
                      Final Approval
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Attachments Card */}
              <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4 flex flex-col justify-between min-h-[220px]">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FolderOpen className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Attachments</h4>
                </div>

                {po.images && po.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 my-auto pt-1">
                    {po.images.map((img: string, idx: number) => {
                      const backendBase = process.env.NEXT_PUBLIC_BASE_URL?.split('/api')[0] || '';
                      const fullUrl = `${backendBase}${img}`;
                      const isPdf = img.toLowerCase().endsWith(".pdf");
                      return (
                        <a
                          key={idx}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center border border-zinc-200 rounded-lg p-3 hover:bg-zinc-50 transition-colors group"
                        >
                          {isPdf ? (
                            <FileText className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
                          ) : (
                            <img src={fullUrl} alt="PO Attachment" className="h-10 w-10 object-cover rounded-md border border-zinc-100" />
                          )}
                          <span className="text-[8px] font-black text-zinc-500 mt-1 truncate w-full text-center">
                            {img.split("/").pop()}
                          </span>
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center border border-dashed border-zinc-200 rounded-lg my-auto bg-zinc-50/50 gap-1.5">
                    <FolderOpen className="h-6 w-6 text-zinc-300" />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-black text-zinc-500">No attachments available</p>
                      <p className="text-[9px] text-zinc-400 font-bold">Upload documents related to this PO</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR PANEL */}
          <div className="space-y-6">
            
            {/* Vendor Details Sidebar Card */}
            <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                  <User className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black text-zinc-900 tracking-tight uppercase tracking-[0.12em]">Vendor Details</h4>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-10 w-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                  {getInitials(po.vendorName)}
                </div>
                <div className="flex flex-col">
                  <h5 className="text-xs font-black text-zinc-900 leading-none">{po.vendorName}</h5>
                  <Badge className="bg-amber-50 hover:bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase w-fit mt-1">
                    ★ Preferred Vendor
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <div className="flex items-start gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-bold text-zinc-650 leading-tight">{po.vendorMobile || "+91 93255 72418"}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-bold text-zinc-655 leading-tight">{po.vendorAddress || "M27C+4V6"}</span>
                </div>
              </div>

              {/* Vendor stats micro-cards */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex flex-col justify-between gap-1">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Total Orders</span>
                  <span className="text-xs font-black text-zinc-800">58</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex flex-col justify-between gap-1">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Outstanding</span>
                  <span className="text-xs font-black text-zinc-800">₹12,000</span>
                </div>
              </div>
            </div>

            {/* Cost Summary Sidebar Card */}
            <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black text-zinc-900 tracking-tight uppercase tracking-[0.12em]">Cost Summary</h4>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Items Subtotal", val: `₹${Number(calculatedSubtotal).toLocaleString("en-IN")}` },
                  { label: "GST / Taxes", val: `₹${Number(po.gst || 0).toLocaleString("en-IN")}` },
                  { label: "Freight Charges", val: `₹${Number(po.freightCharges || 0).toLocaleString("en-IN")}` },
                  { label: "Packaging Charges", val: `₹${Number(po.packagingCharges || 0).toLocaleString("en-IN")}` },
                  { label: "Other Charges", val: `₹${Number(po.otherCharges || 0).toLocaleString("en-IN")}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                    <span className="font-bold text-zinc-400">{item.label}</span>
                    <span className="font-black text-zinc-800">{item.val}</span>
                  </div>
                ))}

                <div className="h-px bg-zinc-150 my-4" />
                
                <div className="flex items-end justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none">Grand Total</span>
                    <span className="text-2xl font-black text-zinc-950 tracking-tighter mt-1.5">
                      ₹ {Number(po.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {/* Faded currency background icon */}
                  <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-200 shadow-inner">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar Card */}
            <div className="bg-white p-5 rounded-lg border border-zinc-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black text-zinc-900 tracking-tight uppercase tracking-[0.12em]">Quick Actions</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => exportPurchaseOrderReceipt(po)}
                  className="flex flex-col items-center justify-center border border-zinc-200 hover:bg-zinc-50 rounded-lg p-3 gap-1.5 transition-all group"
                >
                  <Printer className="h-4.5 w-4.5 text-zinc-400 group-hover:text-teal-600 transition-colors" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase">Print</span>
                </button>
                <button 
                  onClick={() => exportPurchaseOrderReceipt(po)}
                  className="flex flex-col items-center justify-center border border-zinc-200 hover:bg-zinc-50 rounded-lg p-3 gap-1.5 transition-all group"
                >
                  <Download className="h-4.5 w-4.5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase">Download PDF</span>
                </button>
                <button 
                  onClick={() => {
                    toast.info("Duplication is not implemented yet")
                  }}
                  className="flex flex-col items-center justify-center border border-zinc-200 hover:bg-zinc-50 rounded-lg p-3 gap-1.5 transition-all group"
                >
                  <Copy className="h-4.5 w-4.5 text-zinc-400 group-hover:text-amber-600 transition-colors" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase">Duplicate PO</span>
                </button>
                <button 
                  onClick={handleCancelPO}
                  className="flex flex-col items-center justify-center border border-zinc-200 hover:bg-rose-50 rounded-lg p-3 gap-1.5 transition-all group border-rose-100/50"
                >
                  <Trash2 className="h-4.5 w-4.5 text-rose-400 group-hover:text-rose-600 transition-colors" />
                  <span className="text-[9px] font-black text-zinc-500 group-hover:text-rose-600 uppercase">Cancel PO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}
