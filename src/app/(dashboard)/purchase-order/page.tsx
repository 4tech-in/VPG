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
import { PurchaseOrder } from "@/service/purchaseOrderService"
import { CreatePODialog } from "@/components/purchase-order/po-dialogs"

export default function PurchaseOrderPage() {
  const router = useRouter()
  const {
    purchaseOrders,
    isLoading,
    page,
    setPage,
    limit,
    search,
    setSearch,
    totalPages,
    totalItems,
    cancelPO,
    refetch
  } = usePurchaseOrders()



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
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items || []
        const previewText = items
          .map(item => item.itemId?.name || item.itemId?.itemName || "Material")
          .slice(0, 3)
          .join(", ")

        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{items.length} {items.length === 1 ? "Item" : "Items"}</span>
            <span className="text-[10px] text-zinc-400 font-medium max-w-[200px] truncate">{previewText || "N/A"}</span>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-full px-4 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider",
            status === "Draft" && "bg-zinc-100 text-zinc-600 border-zinc-200",
            status === "PendingApproval" && "bg-amber-50 text-amber-600 border-amber-100",
            status === "Approved" && "bg-blue-50 text-blue-600 border-blue-100",
            status === "Rejected" && "bg-rose-50 text-rose-600 border-rose-100",
            status === "Ordered" && "bg-indigo-50 text-indigo-600 border-indigo-100",
            status === "PartiallyReceived" && "bg-orange-50 text-orange-600 border-orange-100",
            status === "Received" && "bg-emerald-50 text-emerald-600 border-emerald-100",
            status === "Issued" && "bg-teal-50 text-teal-600 border-teal-100",
            status === "Cancelled" && "bg-zinc-50 text-zinc-400 border-zinc-150"
          )}>
            {status.replace(/([A-Z])/g, " $1").trim()}
          </Badge>
        )
      },
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
      id: "actions",
      header: () => <div className="text-right pr-4">Action</div>,
      cell: ({ row }) => {
        const po = row.original
        const isCancellable = !["Received", "Issued", "Cancelled"].includes(po.status)
        return (
          <div className="flex items-center justify-end gap-1 pr-4">
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => router.push(`/purchase-order/${po._id || po.id}`)}
               className="h-8 w-8 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all"
               title="View Details"
             >
                <Eye className="h-4 w-4" />
             </Button>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-8 w-8 rounded-lg hover:bg-amber-50 text-zinc-400 hover:text-amber-600 transition-all"
               title="Print PO"
             >
                <Printer className="h-4 w-4" />
             </Button>
             {isCancellable && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => {
                   if (confirm(`Are you sure you want to cancel purchase order ${po.poNo}?`)) {
                     cancelPO(po._id || po.id || "")
                   }
                 }}
                 className="h-8 w-8 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-all"
                 title="Cancel Order"
               >
                  <XCircle className="h-4 w-4" />
               </Button>
             )}
          </div>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Purchase Orders">
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

              <CreatePODialog
                onSuccess={refetch}
                trigger={
                  <Button 
                    className="h-11 px-6 rounded-xl bg-primary font-black shadow-lg shadow-primary/20 gap-2 text-white"
                  >
                     <Plus className="h-4 w-4" /> Create New Order
                  </Button>
                }
              />
           </div>
        </div>

        {/* Board */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm animate-in fade-in duration-300">
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
             />
           )}
        </div>
      </div>
    </ContentLayout>
  )
}
