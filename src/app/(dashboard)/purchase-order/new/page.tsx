"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
   ArrowLeft,
   FileText,
   Wallet,
   MapPin,
   MessageSquare,
   StickyNote,
   Files,
   ClipboardCheck,
   CalendarDays,
   Store,
   User,
   Phone,
   Mail,
   Building,
   UploadCloud,
   Box,
   Loader2
} from "lucide-react"
import { toast } from "sonner"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { indentService } from "@/service/indents.api"
import { vendorService } from "@/service/vendorService"
import { purchaseOrderService } from "@/service/purchaseOrderService"

export default function CreatePOPage() {
   const router = useRouter()
   const [activeTab, setActiveTab] = useState<"remarks" | "notes" | "files" >("remarks")
   const [selectedIndentId, setSelectedIndentId] = useState<string>("")
   const [selectedVendorId, setSelectedVendorId] = useState<string>("")

   const [indents, setIndents] = useState<any[]>([])
   const [vendors, setVendors] = useState<any[]>([])
   const [activeIndent, setActiveIndent] = useState<any | null>(null)
   const [items, setItems] = useState<any[]>([])
   const [isDataLoading, setIsDataLoading] = useState(true)

   const calledRef = useRef(false)

   useEffect(() => {
      if (calledRef.current) return
      calledRef.current = true

      const loadInitialData = async () => {
         setIsDataLoading(true)
         try {
            const indentsRes = await indentService.getIndents({ status: "Approved" })
            setIndents(indentsRes.data || indentsRes || [])
            
            const vendorsRes = await vendorService.getVendors()
            setVendors(vendorsRes.vendors || vendorsRes || [])
         } catch (err: any) {
            toast.error("Failed to load indents or vendors data")
         } finally {
            setIsDataLoading(false)
         }
      }
      loadInitialData()
   }, [])

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
                  price: 0
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

   const handlePriceChange = (idx: number, val: number) => {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item))
   }

   const activeVendor = vendors.find(v => (v._id || v.id) === selectedVendorId)

   const subtotal = items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0)
   const freight = activeVendor ? 1200 : 0
   const packing = activeVendor ? 500 : 0
   const taxableAmount = activeVendor ? (subtotal + freight + packing) : 0
   const gst = activeVendor ? Math.round(taxableAmount * 0.18) : 0
   const grandTotal = activeVendor ? (taxableAmount + gst) : 0

   const handleGeneratePO = async () => {
      if (!selectedIndentId || !selectedVendorId || !activeVendor) {
         toast.error("Please select both indent and vendor")
         return
      }

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
         router.push("/purchase-order")
      } catch (err) {}
   }

   if (isDataLoading) {
      return (
         <ContentLayout title="Create Purchase Order">
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
               <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
               <p className="text-zinc-500 font-bold text-sm">Loading PO source details...</p>
            </div>
         </ContentLayout>
      )
   }

   return (
      <ContentLayout title="Create Purchase Order">
         <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

            {/* Header Navigation */}
            <div className="flex items-center gap-4">
               <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-10 w-10 rounded-full border-zinc-200 hover:bg-zinc-50 shadow-sm"
               >
                  <ArrowLeft className="h-5 w-5 text-zinc-600" />
               </Button>
               <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Create Purchase Order</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">

               {/* Left Column: Form Details */}
               <div className="space-y-8">

                  {/* Purchase Source Block */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-2 w-32 bg-teal-500/5 rounded-bl-full" />
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                           <h3 className="text-xl font-black text-zinc-900 leading-tight">Purchase Source</h3>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Indent and related vendor</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                           <FileText className="h-5 w-5" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Indent</Label>
                           <Select value={selectedIndentId} onValueChange={handleIndentSelect}>
                              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-teal-500 focus:bg-white transition-all shadow-sm">
                                 <SelectValue placeholder="Select Indent" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                 {indents.map((ind) => (
                                    <SelectItem key={ind._id} value={ind._id}>{ind.indentNo} ({ind.projectId?.projectName || ind.projectId?.name || "Project"})</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendor</Label>
                           <Select value={selectedVendorId} onValueChange={handleVendorSelect}>
                              <SelectTrigger className="h-14 rounded-2xl border-zinc-100 font-bold focus:ring-teal-500 transition-all shadow-sm bg-zinc-50/50 text-zinc-900">
                                 <SelectValue placeholder="Select Vendor" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                 {vendors.map((vendor) => (
                                    <SelectItem key={vendor._id} value={vendor._id}>{vendor.name}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </div>

                  <AnimatePresence>
                     {selectedIndentId && activeIndent && (
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="space-y-8"
                        >
                           {/* Order Items Block */}
                           <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex flex-col gap-1">
                                    <h3 className="text-xl font-black text-zinc-900 leading-tight">Requested Items</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Materials requested in {activeIndent?.indentNo}</p>
                                 </div>
                                 <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-4 py-1 font-black text-[10px]">
                                    {items.length} {items.length === 1 ? "Item" : "Items"}
                                 </Badge>
                              </div>

                              <div className="rounded-2xl border border-zinc-100 overflow-hidden">
                                 <table className="w-full text-left border-collapse">
                                    <thead>
                                       <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item Information</th>
                                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Quantity</th>
                                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Unit Price (₹)</th>
                                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Total Amount</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                       {items.map((item, idx) => (
                                          <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                                             <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                   <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                      <Box className="h-5 w-5" />
                                                   </div>
                                                   <div className="flex flex-col">
                                                      <span className="text-sm font-black text-zinc-900">{item.name}</span>
                                                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {item.itemId.slice(-6).toUpperCase()}</span>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-6 py-4 text-center">
                                                <span className="bg-zinc-100 px-3 py-1 rounded-lg text-[11px] font-black text-zinc-600">{item.qty} {item.unit}</span>
                                             </td>
                                             <td className="px-6 py-4 text-center w-36">
                                                <div className="relative">
                                                   <Input 
                                                      type="number" 
                                                      min="0"
                                                      value={item.price} 
                                                      onWheel={(e) => e.currentTarget.blur()}
                                                      onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                                                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-sm font-bold text-center focus-visible:ring-teal-500 focus:bg-white" 
                                                   />
                                                </div>
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col">
                                                   <span className="text-sm font-black text-zinc-900">₹{(item.qty * (item.price || 0)).toLocaleString("en-IN")}</span>
                                                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Incl. Tax</span>
                                                </div>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>

                           {/* Validity & Delivery Block */}
                           {activeVendor && (
                              <motion.div
                                 initial={{ opacity: 0, y: 15 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden"
                              >
                                 <div className="absolute top-0 right-0 h-2 w-32 bg-amber-500/5 rounded-bl-full" />
                                 <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                       <h3 className="text-xl font-black text-zinc-900 leading-tight">Validity & Delivery</h3>
                                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Specify order validity and expected timeline</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                       <CalendarDays className="h-5 w-5" />
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                       <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid From</Label>
                                       <Input type="date" defaultValue="2026-05-12" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-teal-500" />
                                    </div>
                                    <div className="space-y-3">
                                       <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid To</Label>
                                       <Input type="date" defaultValue="2026-06-01" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-teal-500" />
                                    </div>
                                    <div className="space-y-3">
                                       <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Est. Delivery Date</Label>
                                       <Input type="date" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-teal-500" />
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {/* Vendor Details Block */}
                           {activeVendor && (
                              <motion.div
                                 initial={{ opacity: 0, y: 15 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden"
                              >
                                 <div className="absolute top-0 right-0 h-2 w-32 bg-indigo-500/5 rounded-bl-full" />
                                 <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                       <h3 className="text-xl font-black text-zinc-900 leading-tight">Vendor Details</h3>
                                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verified supplier information</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                       <Store className="h-5 w-5" />
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="flex items-start gap-4">
                                       <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                          <User className="h-5 w-5" />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">Contact Person</span>
                                          <span className="text-sm font-black text-zinc-900 mt-1 leading-none">{activeVendor.contactPerson || activeVendor.name}</span>
                                          <span className="text-[10px] font-bold text-zinc-400 mt-1">Supplier Agent</span>
                                       </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                       <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                          <Building className="h-5 w-5" />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">Business Address</span>
                                          <span className="text-sm font-black text-zinc-900 mt-1 leading-tight">{activeVendor.address || "N/A"}</span>
                                          <span className="text-[10px] font-bold text-zinc-400 mt-1">{activeVendor.city || activeVendor.state || ""}</span>
                                       </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                       <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                          <Phone className="h-5 w-5" />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">Contact Number</span>
                                          <span className="text-sm font-black text-zinc-900 mt-1 leading-none">{activeVendor.contactNumber}</span>
                                          <span className="text-[10px] font-bold text-zinc-400 mt-1">Official Mobile</span>
                                       </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                       <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                          <Mail className="h-5 w-5" />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">Email Address</span>
                                          <span className="text-sm font-black text-zinc-900 mt-1 leading-none">{activeVendor.email || "N/A"}</span>
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Tabs Section */}
                  <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
                     <div className="grid grid-cols-3 bg-zinc-50/50 p-1">
                        {[
                           { id: "remarks", label: "REMARKS", icon: MessageSquare },
                           { id: "notes", label: "NOTES", icon: StickyNote },
                           { id: "files", label: "FILES", icon: Files },
                        ].map((tab) => (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={cn(
                                 "h-14 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all",
                                 activeTab === tab.id
                                    ? "bg-white text-teal-600 shadow-sm border border-zinc-100"
                                    : "text-zinc-400 hover:text-zinc-600"
                              )}
                           >
                              <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-teal-500" : "text-zinc-300")} />
                              {tab.label}
                           </button>
                        ))}
                     </div>
                     <div className="p-10 min-h-[250px]">
                        <AnimatePresence mode="wait">
                           {activeTab === "remarks" && (
                              <motion.div
                                 key="remarks"
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 10 }}
                                 className="flex flex-col gap-4"
                              >
                                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">INTERNAL ORDER REMARKS</h4>
                                 <Textarea
                                    placeholder="Add general remarks about this purchase order..."
                                    className="min-h-[160px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-8 font-bold text-sm focus:ring-teal-500 focus:bg-white transition-all shadow-inner placeholder:text-zinc-300"
                                 />
                              </motion.div>
                           )}
                           {activeTab === "files" && (
                              <motion.div
                                 key="files"
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 10 }}
                                 className="flex flex-col items-center justify-center h-full py-10 gap-6"
                              >
                                 <div className="h-20 w-20 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 border-dashed">
                                    <UploadCloud className="h-10 w-10" />
                                 </div>
                                 <div className="flex flex-col items-center gap-1">
                                    <span className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">CLICK OR DROP FILES TO UPLOAD</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">PDF, JPG, PNG (MAX 10MB)</span>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>

               {/* Right Column: Order Summary & Logistics */}
               <div className="space-y-8">

                  {/* Order Summary Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-2 w-32 bg-zinc-500/5 rounded-bl-full" />
                     <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Order Summary</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Final payable amount</p>
                     </div>

                     <div className="space-y-4 pt-4">
                        {[
                           { label: "Subtotal", val: activeIndent ? `₹ ${subtotal.toLocaleString("en-IN")}` : "₹ 0" },
                           { label: "Freight & Cartage", val: activeVendor ? `₹ ${freight.toLocaleString("en-IN")}` : "₹ 0" },
                           { label: "Packing & Forwarding", val: activeVendor ? `₹ ${packing.toLocaleString("en-IN")}` : "₹ 0" },
                        ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-500">{item.label}</span>
                              <span className="text-sm font-black text-zinc-900">{item.val}</span>
                           </div>
                        ))}
                        <div className="h-px bg-zinc-50 my-4" />
                        <div className="flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-500">Taxable Amount</span>
                              <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">(SUBTOTAL + LOGISTICS)</span>
                           </div>
                           <span className="text-base font-black text-zinc-900">{activeVendor ? `₹ ${taxableAmount.toLocaleString("en-IN")}` : "₹ 0"}</span>
                        </div>

                        <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100/50 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-teal-600 uppercase tracking-tight">GST Amount (18%)</span>
                              <span className={cn(
                                 "text-[8px] font-black uppercase tracking-widest mt-1",
                                 activeVendor ? "text-teal-500/60" : "text-zinc-300"
                              )}>
                                 CGST: {activeVendor ? `₹${Math.round(gst / 2).toLocaleString("en-IN")}` : "₹0"}  SGST: {activeVendor ? `₹${Math.round(gst / 2).toLocaleString("en-IN")}` : "₹0"}
                              </span>
                           </div>
                           <span className="text-lg font-black text-teal-600">{activeVendor ? `₹ ${gst.toLocaleString("en-IN")}` : "₹ 0"}</span>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-zinc-50 flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">GRAND TOTAL</span>
                           <span className="text-4xl font-black text-zinc-900 tracking-tighter mt-1">
                              {activeVendor ? `₹ ${grandTotal.toLocaleString("en-IN")}` : "₹ 0"}
                           </span>
                        </div>
                        <div className={cn(
                           "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                           activeVendor ? "bg-teal-500 text-white shadow-teal-500/20" : "bg-zinc-50 text-zinc-300"
                        )}>
                           <Wallet className="h-7 w-7" />
                        </div>
                     </div>
                  </div>

                  {/* Drop Location Section */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                           <MapPin className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-zinc-900 tracking-tight">Drop Location</h4>
                     </div>
                     <Textarea
                        placeholder="Specify delivery drop location"
                        defaultValue={activeVendor ? "Site A - Main Store" : ""}
                        className="min-h-[100px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-6 font-bold text-xs focus:ring-teal-500 transition-all shadow-inner placeholder:text-zinc-300"
                     />
                  </div>

                  {/* Final Action */}
                  <Button
                     disabled={!activeVendor}
                     onClick={handleGeneratePO}
                     className={cn(
                        "w-full h-16 rounded-2xl font-black text-base gap-3 shadow-xl transition-all",
                        activeVendor
                           ? "bg-[#14b8a6] hover:bg-[#0d9488] text-white shadow-teal-500/20"
                           : "bg-zinc-100 text-zinc-300"
                     )}
                  >
                     <ClipboardCheck className="h-5 w-5" /> Generate PO
                  </Button>
               </div>
            </div>
         </div>
      </ContentLayout>
   )
}
