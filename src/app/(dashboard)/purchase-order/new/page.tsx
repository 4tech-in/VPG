"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
   Loader2,
   Plus,
   Calculator,
   ShieldCheck,
   Trash2
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
   Command,
   CommandInput,
   CommandList,
   CommandEmpty,
   CommandItem
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { indentService } from "@/service/indents.api"
import { vendorService } from "@/service/vendorService"
import { purchaseOrderService } from "@/service/purchaseOrderService"

function CreatePOContent() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const urlIndentId = searchParams.get("indentId")

   const [activeTab, setActiveTab] = useState<"remarks" | "notes" | "files">("remarks")
   const [selectedIndentId, setSelectedIndentId] = useState<string>("")
   const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])

   const [indents, setIndents] = useState<any[]>([])
   const [vendors, setVendors] = useState<any[]>([])
   const [activeIndent, setActiveIndent] = useState<any | null>(null)
   const [items, setItems] = useState<any[]>([])
   const [isDataLoading, setIsDataLoading] = useState(true)

   // Form inputs state
   const [dropLocation, setDropLocation] = useState("Site A - Main Store")
   const [remark, setRemark] = useState("")
   const [notes, setNotes] = useState("")
   const [validFrom, setValidFrom] = useState("2026-05-12")
   const [validTo, setValidTo] = useState("2026-06-01")
   const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")

   const calledRef = useRef(false)

   const handleIndentSelect = async (val: string) => {
      setSelectedIndentId(val)
      setSelectedVendorIds([])
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
                  price: 0,
                  description: "",
                  assignedVendorId: ""
               }))
            )
         }
      } catch (err) {
         toast.error("Failed to fetch indent details")
      }
   }

   useEffect(() => {
      if (calledRef.current) return
      calledRef.current = true

      const loadInitialData = async () => {
         setIsDataLoading(true)
         try {
            const indentsRes = await indentService.getIndents({ status: "Approved" })
            const loadedIndents = indentsRes.data || indentsRes || []
            setIndents(loadedIndents)
            
            const vendorsRes = await vendorService.getVendors({ limit: 200 })
            setVendors(vendorsRes.vendors || vendorsRes || [])

            if (urlIndentId) {
               const found = loadedIndents.find((i: any) => i._id === urlIndentId)
               if (found) {
                  await handleIndentSelect(urlIndentId)
               } else {
                  try {
                     const directIndent = await indentService.getIndentById(urlIndentId)
                     if (directIndent) {
                        setIndents(prev => {
                           if (!prev.some(i => i._id === urlIndentId)) {
                              return [...prev, directIndent]
                           }
                           return prev
                        })
                        await handleIndentSelect(urlIndentId)
                     }
                  } catch (e) {
                     // ignore
                  }
               }
            }
         } catch (err: any) {
            toast.error("Failed to load indents or vendors data")
         } finally {
            setIsDataLoading(false)
         }
      }
      loadInitialData()
   }, [urlIndentId])

   const handleVendorToggle = (val: string) => {
      setSelectedVendorIds(prev => 
         prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
      )
   }

   const handleVendorAssignmentChange = (idx: number, vendorId: string) => {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, assignedVendorId: vendorId } : item))
   }

   const handleQtyChange = (idx: number, val: number) => {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, qty: val } : item))
   }

   const handlePriceChange = (idx: number, val: number) => {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item))
   }

   const handleDescriptionChange = (idx: number, val: string) => {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, description: val } : item))
   }

   const handleAddAnotherItem = () => {
      setItems(prev => [
         ...prev,
         {
            itemId: `custom-${Date.now()}`,
            name: "New Item",
            qty: 1,
            unitId: "",
            unit: "Pcs",
            price: 0,
            description: "",
            assignedVendorId: selectedVendorIds[0] || ""
         }
      ])
   }

   const handleRemoveItem = (idx: number) => {
      setItems(prev => prev.filter((_, i) => i !== idx))
   }

   const activeVendors = vendors.filter(v => selectedVendorIds.includes(v._id || v.id))

   const subtotal = items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0)
   const grandTotal = subtotal

   const handleGeneratePO = async () => {
      if (!selectedIndentId || selectedVendorIds.length === 0) {
         toast.error("Please select an indent and at least one vendor")
         return
      }

      const unassignedItems = items.filter(item => !item.assignedVendorId)
      if (unassignedItems.length > 0) {
         toast.error("Please assign a vendor to all requested items")
         return
      }

      if (items.some(item => (Number(item.qty) || 0) <= 0)) {
         toast.error("All items must have a quantity greater than 0")
         return
      }

      try {
         const groupedItems: Record<string, any[]> = {}
         items.forEach(item => {
            if (!groupedItems[item.assignedVendorId]) groupedItems[item.assignedVendorId] = []
            groupedItems[item.assignedVendorId].push(item)
         })

         for (const vendorId of Object.keys(groupedItems)) {
            const vendor = vendors.find(v => (v._id || v.id) === vendorId)
            if (!vendor) continue
            
            await purchaseOrderService.createPurchaseOrder({
               indentId: selectedIndentId,
               vendorId: vendorId,
               vendorName: vendor.name,
               vendorMobile: vendor.contactNumber || "",
               vendorAddress: vendor.address || "",
               items: groupedItems[vendorId].map(item => ({
                  itemId: item.itemId.startsWith("custom-") ? null : item.itemId,
                  unitId: item.unitId || null,
                  indentQuantity: item.qty,
                  orderQuantity: item.qty,
                  rate: item.price,
                  description: item.description || ""
               })),
               validFrom: validFrom || null,
               validTo: validTo || null,
               expectedDeliveryDate: expectedDeliveryDate || null,
               remark: remark || null,
               notes: notes || null,
               bypassApproval: true
            })
         }
         
         toast.success("Purchase Order(s) created successfully")
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
         <div className="flex flex-col gap-6 max-w-full mx-auto">

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

            <div className="grid grid-cols-1 xl:grid-cols-[1fr,360px] gap-6 items-start">

               {/* Left Column: Form Details */}
               <div className="space-y-6 min-w-0">

                  {/* Purchase Source Block */}
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-full bg-[#EAF6F5] flex items-center justify-center text-[#0A5C53] border border-[#D1ECE8]">
                              <Box className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col">
                              <h3 className="text-lg font-black text-zinc-900 leading-tight">Purchase Source</h3>
                              <p className="text-xs font-bold text-zinc-400">Select indent and vendor details</p>
                           </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                           <FileText className="h-5 w-5" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Indent</Label>
                           <Select value={selectedIndentId} onValueChange={handleIndentSelect}>
                              <SelectTrigger className="h-16 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary focus:bg-white transition-all shadow-sm">
                                 <SelectValue placeholder="Select Indent" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl p-1">
                                 {indents.map((ind) => (
                                    <SelectItem key={ind._id} value={ind._id} className="rounded-xl py-3">
                                       <div className="flex flex-col gap-0.5 text-left">
                                          <span className="font-black text-zinc-900 text-sm">{ind.indentId || ind.indentNo} &mdash; {ind.projectId?.projectName || ind.projectId?.name || "Project"}</span>
                                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-2">
                                             <span>By: {ind.requestedBy?.name || "Unknown"}</span>
                                             <span>&bull;</span>
                                             <span>{new Date(ind.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                          </span>
                                       </div>
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendor</Label>
                           <Popover>
                              <PopoverTrigger asChild>
                                 <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full h-16 rounded-2xl border-zinc-100 font-bold focus:ring-primary transition-all shadow-sm bg-zinc-50/50 text-zinc-900 justify-between px-4"
                                 >
                                    <span className="truncate text-left font-black">
                                       {selectedVendorIds.length > 0
                                          ? `${selectedVendorIds.length} Vendor${selectedVendorIds.length > 1 ? "s" : ""} selected`
                                          : "Select Vendors..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                 </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-0 rounded-2xl shadow-xl border-zinc-100" align="start">
                                 <Command>
                                    <CommandInput placeholder="Search vendor..." className="h-10" />
                                    <CommandList className="max-h-60">
                                       <CommandEmpty>No vendor found.</CommandEmpty>
                                       {vendors.map((vendor) => {
                                          const vId = vendor._id || vendor.id
                                          const isSelected = selectedVendorIds.includes(vId)
                                          return (
                                             <CommandItem
                                                key={vId}
                                                value={vendor.name}
                                                onSelect={() => handleVendorToggle(vId)}
                                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-bold"
                                             >
                                                <div className={cn(
                                                   "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                   isSelected ? "bg-primary border-primary" : "border-zinc-300"
                                                )}>
                                                   {isSelected && <Check className="h-3 w-3 text-white" />}
                                                 </div>
                                                 <span className="text-sm">{vendor.name}</span>
                                             </CommandItem>
                                          )
                                       })}
                                    </CommandList>
                                 </Command>
                              </PopoverContent>
                           </Popover>
                        </div>
                     </div>
                  </div>

                  <AnimatePresence>
                     {selectedIndentId && activeIndent && (
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="space-y-6"
                        >
                           {/* Order Items Block */}
                           <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex flex-col">
                                    <h3 className="text-lg font-black text-zinc-900 leading-tight">Requested Items</h3>
                                    <p className="text-xs font-bold text-zinc-400">Materials requested to purchase</p>
                                 </div>
                                 <Badge className="bg-[#EAF6F5] text-[#0A5C53] border-none rounded-full px-4 py-1.5 font-black text-xs">
                                    {items.length} {items.length === 1 ? "Item" : "Items"}
                                 </Badge>
                              </div>

                              <div className="rounded-2xl border border-zinc-150 overflow-x-auto">
                                 <table className="w-full text-left border-collapse min-w-[760px]">
                                    <thead>
                                       <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item Information</th>
                                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-left">Description</th>
                                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Quantity</th>
                                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Unit Price (₹)</th>
                                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Assign Vendor</th>
                                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Total Amount</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                       {items.map((item, idx) => (
                                          <tr key={idx} className="group hover:bg-zinc-50/50 transition-colors">
                                             <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                   <div className="h-9 w-9 rounded-lg bg-[#F0F5FA] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                                      <Box className="h-4.5 w-4.5" />
                                                   </div>
                                                   <div className="flex flex-col min-w-0">
                                                      <span className="text-xs font-black text-zinc-900 truncate">{item.name}</span>
                                                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">ID: {item.itemId.slice(-6).toUpperCase()}</span>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-4 py-3 w-36">
                                                <Input 
                                                   placeholder="Details"
                                                   value={item.description || ""}
                                                   onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                                                   className="h-9 rounded-lg bg-zinc-50 border-zinc-200 text-xs font-bold focus-visible:ring-primary focus:bg-white" 
                                                />
                                             </td>
                                             <td className="px-4 py-3 text-center w-28">
                                                <div className="flex items-center justify-center gap-1.5">
                                                   <Input 
                                                      type="number" 
                                                      min="0.001"
                                                      step="any"
                                                      value={item.qty} 
                                                      onWheel={(e) => e.currentTarget.blur()}
                                                      onChange={(e) => handleQtyChange(idx, e.target.value === "" ? 0 : Number(e.target.value))}
                                                      className="h-9 rounded-lg bg-zinc-50 border-zinc-200 text-xs font-bold text-center focus-visible:ring-primary focus:bg-white w-14" 
                                                   />
                                                   <span className="text-[9px] font-bold text-zinc-500">{item.unit}</span>
                                                </div>
                                             </td>
                                             <td className="px-4 py-3 text-center w-28">
                                                <Input 
                                                   type="number" 
                                                   min="0"
                                                   value={item.price || ""} 
                                                   placeholder="—"
                                                   onWheel={(e) => e.currentTarget.blur()}
                                                   onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                                                   className="h-9 rounded-lg bg-zinc-50 border-zinc-200 text-xs font-bold text-center focus-visible:ring-primary focus:bg-white" 
                                                />
                                             </td>
                                             <td className="px-4 py-3 text-center w-36">
                                                <Select 
                                                   value={item.assignedVendorId || ""} 
                                                   onValueChange={(val) => handleVendorAssignmentChange(idx, val)}
                                                >
                                                   <SelectTrigger className="h-9 rounded-lg bg-zinc-50 border-zinc-200 text-[11px] font-bold focus:ring-primary focus:bg-white shadow-sm">
                                                      <SelectValue placeholder="Select Vendor" />
                                                   </SelectTrigger>
                                                   <SelectContent className="rounded-xl">
                                                      {activeVendors.length > 0 ? (
                                                         activeVendors.map(vendor => (
                                                            <SelectItem key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                                                               {vendor.name}
                                                            </SelectItem>
                                                         ))
                                                      ) : (
                                                         <div className="p-2 text-xs text-zinc-400 text-center font-bold">Select vendors first</div>
                                                      )}
                                                   </SelectContent>
                                                </Select>
                                             </td>
                                             <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                   <div className="flex flex-col">
                                                      <span className="text-xs font-black text-zinc-900">₹{(item.qty * (item.price || 0)).toLocaleString("en-IN")}</span>
                                                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Incl. Tax</span>
                                                   </div>
                                                   <Button 
                                                      variant="ghost" 
                                                      size="icon" 
                                                      onClick={() => handleRemoveItem(idx)}
                                                      className="h-7 w-7 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                   >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                   </Button>
                                                </div>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>

                            
                           </div>

                           {/* Validity & Delivery Block */}
                           {activeVendors.length > 0 && (
                              <motion.div
                                 initial={{ opacity: 0, y: 15 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden"
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                       <h3 className="text-lg font-black text-zinc-900 leading-tight">Validity & Delivery</h3>
                                       <p className="text-xs font-bold text-zinc-400">Specify order validity and expected timeline</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                       <CalendarDays className="h-5 w-5" />
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid From</Label>
                                       <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary" />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid To</Label>
                                       <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary" />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Est. Delivery Date</Label>
                                       <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary" />
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {/* Vendor Details Block */}
                           {activeVendors.length > 0 && (
                              <motion.div
                                 initial={{ opacity: 0, y: 15 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden"
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                       <h3 className="text-lg font-black text-zinc-900 leading-tight">Selected Vendors</h3>
                                       <p className="text-xs font-bold text-zinc-400">Verified supplier information</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                       <Store className="h-5 w-5" />
                                    </div>
                                 </div>

                                 <div className="flex flex-col divide-y divide-zinc-100">
                                    {activeVendors.map((vendor: any) => (
                                       <div key={vendor._id || vendor.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 first:pt-2 last:pb-2">
                                          <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                                <User className="h-5 w-5" />
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Vendor Name</span>
                                                <span className="text-sm font-black text-zinc-900 mt-0.5">{vendor.name}</span>
                                                {vendor.contactPerson && <span className="text-[10px] font-bold text-zinc-400">{vendor.contactPerson}</span>}
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                                <Building className="h-5 w-5" />
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Business Address</span>
                                                <span className="text-sm font-black text-zinc-900 mt-0.5">{vendor.address || "N/A"}</span>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                                <Phone className="h-5 w-5" />
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Contact Number</span>
                                                <span className="text-sm font-black text-zinc-900 mt-0.5">{vendor.contactNumber || "N/A"}</span>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                                <Mail className="h-5 w-5" />
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Email Address</span>
                                                <span className="text-sm font-black text-zinc-900 mt-0.5">{vendor.email || "N/A"}</span>
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </motion.div>
                           )}
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Tabs Section */}
                  <div className="bg-white rounded-[2rem] border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col">
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
                                 "h-12 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all",
                                 activeTab === tab.id
                                    ? "bg-white text-primary shadow-sm border border-zinc-100"
                                    : "text-zinc-400 hover:text-zinc-600"
                              )}
                           >
                              <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-zinc-300")} />
                              {tab.label}
                           </button>
                        ))}
                     </div>
                     <div className="p-6 min-h-[200px]">
                        <AnimatePresence mode="wait">
                           {activeTab === "remarks" && (
                              <motion.div
                                 key="remarks"
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 10 }}
                                 className="flex flex-col gap-3"
                              >
                                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">INTERNAL ORDER REMARKS</h4>
                                 <Textarea
                                    placeholder="Add general remarks about this purchase order..."
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    className="min-h-[100px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-5 font-bold text-sm focus:ring-primary focus:bg-white transition-all shadow-inner placeholder:text-zinc-300"
                                 />
                              </motion.div>
                           )}
                           {activeTab === "notes" && (
                              <motion.div
                                 key="notes"
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 10 }}
                                 className="flex flex-col gap-3"
                              >
                                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ORDER NOTES</h4>
                                 <Textarea
                                    placeholder="Add notes for this purchase order..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[100px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-5 font-bold text-sm focus:ring-primary focus:bg-white transition-all shadow-inner placeholder:text-zinc-300"
                                 />
                              </motion.div>
                           )}
                           {activeTab === "files" && (
                              <motion.div
                                 key="files"
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 10 }}
                                 className="flex flex-col items-center justify-center h-full py-6 gap-4"
                              >
                                 <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 border-dashed">
                                    <UploadCloud className="h-8 w-8" />
                                 </div>
                                 <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">CLICK OR DROP FILES TO UPLOAD</span>
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">PDF, JPG, PNG (MAX 10MB)</span>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>

               {/* Right Column: Order Summary & Logistics */}
               <div className="space-y-6 min-w-0">

                  {/* Order Summary Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden">
                     <div className="flex flex-col">
                        <h3 className="text-lg font-black text-zinc-900 tracking-tight">Order Summary</h3>
                        <p className="text-xs font-bold text-zinc-400">Final payable amount</p>
                     </div>

                     <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-zinc-500">Subtotal</span>
                           <span className="text-sm font-black text-zinc-900">{activeIndent ? `₹ ${subtotal.toLocaleString("en-IN")}` : "₹ 0"}</span>
                        </div>
                     </div>

                     {/* Grand Total box matching screenshot exactly */}
                     <div className="bg-[#EAF6F5] p-5 rounded-3xl flex items-center justify-between border border-[#D5EFEF]">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-[#0A5C53]/70 uppercase tracking-widest">GRAND TOTAL</span>
                           <span className="text-3xl font-black text-[#0A5C53] tracking-tighter mt-0.5">
                              {activeVendors.length > 0 ? `₹ ${grandTotal.toLocaleString("en-IN")}` : "₹ 0"}
                           </span>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-[#0A5C53] text-white flex items-center justify-center shadow-lg shadow-[#0A5C53]/20">
                           <Calculator className="h-6 w-6" />
                        </div>
                     </div>
                  </div>

                  {/* Drop Location Section */}
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#EAF6F5] flex items-center justify-center text-[#0A5C53]">
                           <MapPin className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-zinc-900 tracking-tight">Drop Location</h4>
                     </div>
                     <Textarea
                        placeholder="Specify delivery drop location"
                        value={dropLocation}
                        onChange={(e) => setDropLocation(e.target.value)}
                        className="min-h-[90px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-5 font-bold text-xs focus:ring-primary transition-all shadow-inner placeholder:text-zinc-300"
                     />
                  </div>

                  {/* Final Action */}
                  <div className="space-y-3">
                     <Button
                        disabled={activeVendors.length === 0}
                        onClick={handleGeneratePO}
                        className={cn(
                           "w-full h-16 rounded-2xl font-black text-base gap-3 shadow-xl transition-all",
                           activeVendors.length > 0
                              ? "bg-[#0A5C53] hover:bg-[#084A42] text-white shadow-[#0A5C53]/20"
                              : "bg-zinc-100 text-zinc-300"
                        )}
                     >
                        <ClipboardCheck className="h-5 w-5" /> Generate PO
                     </Button>
                     <p className="text-[10px] font-bold text-zinc-400 flex items-center justify-center gap-1.5 text-center mt-1">
                        <ShieldCheck className="h-4 w-4 text-zinc-400" />
                        Please review all details before generating
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </ContentLayout>
   )
}

export default function CreatePOPage() {
   return (
      <Suspense fallback={
         <ContentLayout title="Create Purchase Order">
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
               <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
               <p className="text-zinc-500 font-bold text-sm">Loading PO source details...</p>
            </div>
         </ContentLayout>
      }>
         <CreatePOContent />
      </Suspense>
   )
}
