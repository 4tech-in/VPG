"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { 
  Plus,
  Eye,
  Printer,
  Search,
  Loader2,
  XCircle,
  FileText,
  Box,
  MapPin,
  ClipboardCheck
} from "lucide-react"
import { toast } from "sonner"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { PurchaseOrder, purchaseOrderService } from "@/service/purchaseOrderService"
import { exportPurchaseOrderReceipt } from "@/lib/export-receipt"
import { ReceiptDialog } from "@/components/purchase-order/receipt-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PurchaseOrderPage() {
  const router = useRouter()
  const {
    purchaseOrders,
    isLoading,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    totalPages,
    totalItems,
    cancelPO,
    refetch
  } = usePurchaseOrders()

  const [showConditions, setShowConditions] = useState(true)
  const [receiptPO, setReceiptPO] = useState<PurchaseOrder | null>(null)
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null)

  const openReceipt = async (po: PurchaseOrder) => {
    const id = po._id || po.id
    if (!id) return
    try {
      setReceiptLoadingId(id)
      const details = await purchaseOrderService.getPurchaseOrderById(id)
      setReceiptPO(details)
    } catch (error: any) {
      toast.error(error?.message || "Unable to load receipt")
    } finally {
      setReceiptLoadingId(null)
    }
  }

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: "poNo",
      header: "PO ID",
      cell: ({ row }) => (
        <div 
          onClick={() => router.push(`/purchase-order/${row.original._id || row.original.id}`)}
          className="font-bold text-teal-600 hover:underline cursor-pointer"
        >
          {row.getValue("poNo")}
        </div>
      ),
    },
    {
      accessorKey: "vendorName",
      header: "Vendor",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{row.original.vendorName}</span>
            <span className="text-[10px] text-zinc-400 font-medium">{row.original.vendorMobile || "No contact"}</span>
          </div>
        )
      },
    },

    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-black text-zinc-900">
          ₹{Number(row.getValue("totalAmount") || 0).toLocaleString("en-IN")}
        </div>
      ),
    },

    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const dateStr = row.original.createdAt
        const date = dateStr ? new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        }) : "N/A"
        return <div className="text-[11px] font-bold text-zinc-500">{date}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const po = row.original
        const isPendingVerification = po.verificationStatus === "PendingVerification"
        const displayStatus = isPendingVerification ? "PendingVerification" : (po.status || "Draft")
        
        return (
          <Badge
            className={cn(
              "px-3 py-1 rounded-full font-black text-[9px] gap-1.5 border-none shadow-sm uppercase tracking-wider",
              displayStatus === "Approved" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
              displayStatus === "PendingVerification" ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
              displayStatus === "Ordered" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
              (displayStatus === "Received" || displayStatus === "Completed") ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
              displayStatus === "PartiallyReceived" ? "bg-teal-100 text-teal-700 hover:bg-teal-100" :
              displayStatus === "Issued" ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
              displayStatus === "Rejected" ? "bg-red-100 text-red-700 hover:bg-red-100" :
              displayStatus === "Cancelled" ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-200" :
              "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
            )}
          >
            {displayStatus === "PendingVerification" ? "Pending Verification" : displayStatus}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center w-44 mx-auto">Action</div>,
      cell: ({ row }) => {
        const po = row.original
        const isCancellable = !["Received", "Issued", "Cancelled"].includes(po.status)
        return (
          <TooltipProvider delayDuration={150}>
          <div className="flex items-center justify-center gap-1.5 w-44 mx-auto">
             <Tooltip><TooltipTrigger asChild><Button
               variant="ghost" size="icon"
               onClick={() => router.push(`/purchase-order/${po._id || po.id}`)}
               className="h-8 w-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-all border border-zinc-200"
               aria-label="View purchase order"
             ><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>View details</TooltipContent></Tooltip>
             <Tooltip><TooltipTrigger asChild><Button
               variant="ghost" size="icon"
               onClick={() => exportPurchaseOrderReceipt(po, showConditions)}
               className="h-8 w-8 rounded-lg bg-amber-50/50 hover:bg-amber-100/80 text-amber-600 transition-all border border-amber-200/50"
               aria-label="Print purchase order"
             ><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Print PO</TooltipContent></Tooltip>
             <Tooltip><TooltipTrigger asChild><Button
               variant="ghost" size="icon"
               onClick={() => openReceipt(po)}
               disabled={receiptLoadingId === (po._id || po.id)}
               className="h-8 w-8 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 transition-all hover:bg-cyan-100"
               aria-label="Open material receipt"
             >{receiptLoadingId === (po._id || po.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent>Material receipt</TooltipContent></Tooltip>
             {isCancellable && (
               <Tooltip><TooltipTrigger asChild><Button
                 variant="ghost" size="icon"
                 onClick={() => {
                   if (confirm(`Are you sure you want to cancel purchase order ${po.poNo}?`)) {
                     cancelPO(po._id || po.id || "")
                   }
                 }}
                 className="h-8 w-8 rounded-lg bg-rose-50/50 hover:bg-rose-100/80 text-rose-600 transition-all border border-rose-200/50"
                 aria-label="Cancel purchase order"
               ><XCircle className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Cancel order</TooltipContent></Tooltip>
             )}
          </div>
          </TooltipProvider>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Purchase Orders">
      {receiptPO && <ReceiptDialog open={Boolean(receiptPO)} onOpenChange={(open) => !open && setReceiptPO(null)} po={receiptPO} />}
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Header Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 animate-in fade-in duration-300">
           <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Purchase Orders</h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Material Procurement Hub</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Input
                  placeholder="Search orders..."
                  className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
              </div>

              <Button
                onClick={() => setShowConditions((prev) => !prev)}
                variant="outline"
                className={`h-11 px-4 rounded-xl font-black text-[11px] gap-2 border shadow-sm transition-all ${
                  showConditions
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <FileText className="h-4 w-4" />
                {showConditions ? "Conditions: ON" : "Conditions: OFF"}
              </Button>

              <Button 
                onClick={() => router.push("/purchase-order/new")}
                className="h-11 px-6 rounded-xl bg-primary font-black shadow-lg shadow-primary/20 gap-2 text-white"
              >
                 <Plus className="h-4 w-4" /> Create New Order
              </Button>
           </div>
        </div>
        {/* Board */}
        <div className="animate-in fade-in duration-300">
           {isLoading && purchaseOrders.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
               <p className="text-zinc-500 font-bold text-sm">Loading procurement board...</p>
             </div>
           ) : (
             <DataTable 
               columns={columns} 
               data={purchaseOrders} 
               isServerSide={true}
               pageIndex={page - 1}
               pageSize={limit}
               pageCount={totalPages}
               totalItems={totalItems}
               searchValue={search}
               onSearchChange={setSearch}
               onPageChange={(p) => setPage(p + 1)}
               onPageSizeChange={(size) => setLimit(size)}
             />
           )}
        </div>

        {/* Floating Bulk Actions Bar */}
        
      </div>
    </ContentLayout>
  )
}
