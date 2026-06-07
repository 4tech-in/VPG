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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { indentService } from "@/service/indents.api"
import { vendorService } from "@/service/vendorService"

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

  // Creation states
  const [isOpen, setIsOpen] = useState(false)
  const [indents, setIndents] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [selectedIndentId, setSelectedIndentId] = useState<string>("")
  const [selectedVendorId, setSelectedVendorId] = useState<string>("")
  const [activeIndent, setActiveIndent] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [dropLocation, setDropLocation] = useState("")
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  // Fetch approved indents & active vendors when Dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        try {
          const indentsRes = await indentService.getIndents({ status: "Approved" })
          setIndents(indentsRes.data || indentsRes || [])
          
          const vendorsRes = await vendorService.getVendors()
          setVendors(vendorsRes.vendors || vendorsRes || [])
        } catch (err: any) {
          toast.error("Failed to load indents or vendors data")
        }
      }
      loadInitialData()
    }
  }, [isOpen])

  const handleIndentSelect = async (val: string) => {
    setSelectedIndentId(val)
    setSelectedVendorId("")
    setActiveIndent(null)
    setItems([])
    
    try {
      const fullIndent = await indentService.getIndentById(val)
      setActiveIndent(fullIndent)
      if (fullIndent && Array.isArray(fullIndent.items)) {
         setItems(
            fullIndent.items.map((item: any) => ({
               itemId: item.itemId?._id || item.itemId || "",
               name: item.itemId?.name || item.itemId?.itemName || "Unknown Item",
               qty: item.quantity,
               unitId: item.unitId?._id || item.unitId || "",
               unit: item.unitId?.name || item.unitId?.unitName || "Pcs",
               price: ""
            }))
         )
      }
    } catch (err) {
      toast.error("Failed to fetch indent details")
    }
  }

  const handleVendorSelect = (val: string) => {
    setSelectedVendorId(val)
  }

  const handlePriceChange = (idx: number, val: number | string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item))
  }

  const activeVendor = vendors.find(v => (v._id || v.id) === selectedVendorId)

  const subtotal = items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0)
  const freight = activeVendor ? 1200 : 0
  const packing = activeVendor ? 500 : 0
  const taxableAmount = activeVendor ? (subtotal + freight + packing) : 0
  const gst = activeVendor ? Math.round(taxableAmount * 0.18) : 0
  const grandTotal = activeVendor ? (taxableAmount + gst) : 0

  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIndentId || !selectedVendorId || !activeVendor) {
       toast.error("Please select both indent and vendor")
       return
    }

    setIsFormSubmitting(true)
    try {
       await purchaseOrderService.createPurchaseOrder({
          indentId: selectedIndentId,
          vendorName: activeVendor.name,
          vendorMobile: activeVendor.contactNumber || "",
          vendorAddress: activeVendor.address || "",
          items: items.map(item => ({
             itemId: item.itemId,
             unitId: item.unitId,
             indentQuantity: item.qty,
             orderQuantity: item.qty,
             rate: item.price
          })),
          bypassApproval: true
       })
       toast.success("Purchase Order created successfully")
       setIsOpen(false)
       
       // Reset form state
       setSelectedIndentId("")
       setSelectedVendorId("")
       setActiveIndent(null)
       setItems([])
       setDropLocation("")

       // Refetch PO list
       refetch()
    } catch (err) {
    } finally {
       setIsFormSubmitting(false)
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

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="h-11 px-6 rounded-xl bg-primary font-black shadow-lg shadow-primary/20 gap-2 text-white"
                  >
                     <Plus className="h-4 w-4" /> Create New Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                  <DialogHeader className="p-8 bg-zinc-900 text-white pb-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-white/15 rounded-xl">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <DialogTitle className="text-2xl font-black tracking-tight">Create Purchase Order</DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                      Generate a new procurement request from an indent
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleGeneratePO} className="p-8 space-y-6">
                    <ScrollArea className="max-h-[55vh] pr-4">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Indent</Label>
                            <Select value={selectedIndentId} onValueChange={handleIndentSelect} required>
                              <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                                <SelectValue placeholder="Choose an Indent" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56">
                                {indents.map((ind) => (
                                  <SelectItem key={ind._id} value={ind._id} className="font-bold text-xs">
                                    {ind.indentId} ({ind.projectId?.projectName || ind.projectId?.name || "No Project"})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Vendor</Label>
                            <Select value={selectedVendorId} onValueChange={handleVendorSelect} required>
                              <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                                <SelectValue placeholder="Choose a Vendor" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56">
                                {vendors.map((vendor) => (
                                  <SelectItem key={vendor._id} value={vendor._id} className="font-bold text-xs">
                                    {vendor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {selectedIndentId && activeIndent && (
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Requested Items</Label>
                            <div className="rounded-2xl border border-zinc-100 overflow-hidden">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                    <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Quantity</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Unit Price (₹)</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                  {items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                          <Box className="h-4 w-4 text-zinc-400" />
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-900">{item.name}</span>
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase">ID: {item.itemId ? item.itemId.slice(-6).toUpperCase() : "N/A"}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-3 text-center">
                                        <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600">{item.qty} {item.unit}</span>
                                      </td>
                                      <td className="px-6 py-3 text-center w-28">
                                        <Input
                                          type="number"
                                          min="0"
                                          value={item.price}
                                          onWheel={(e) => e.currentTarget.blur()}
                                          onChange={(e) => handlePriceChange(idx, e.target.value === "" ? "" : Number(e.target.value))}
                                          className="h-8 rounded-lg bg-zinc-50 border-zinc-200 text-center font-bold text-xs"
                                        />
                                      </td>
                                      <td className="px-6 py-3 text-right text-xs font-bold text-zinc-900">
                                        ₹{(item.qty * (item.price || 0)).toLocaleString("en-IN")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {activeVendor && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Drop Location</Label>
                                  <Textarea
                                    value={dropLocation}
                                    onChange={(e) => setDropLocation(e.target.value)}
                                    placeholder="Specify delivery drop location"
                                    className="min-h-[80px] rounded-xl bg-zinc-50 border-zinc-100 p-4 font-bold text-xs"
                                  />
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Subtotal:</span>
                                    <span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Logistics (Freight/Packing):</span>
                                    <span className="font-bold">₹{(freight + packing).toLocaleString("en-IN")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">GST (18%):</span>
                                    <span className="font-bold">₹{gst.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div className="h-px bg-zinc-200 my-2" />
                                  <div className="flex justify-between text-sm">
                                    <span className="font-black text-zinc-900">Grand Total:</span>
                                    <span className="font-black text-teal-600">₹{grandTotal.toLocaleString("en-IN")}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4 border-t border-zinc-50 gap-2">
                      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold text-zinc-400">
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!activeVendor || isFormSubmitting}
                        className="rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/10 gap-2"
                      >
                        {isFormSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="h-4 w-4" /> Generate PO
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
