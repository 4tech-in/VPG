"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
   Save
} from "lucide-react"
import { toast } from "sonner"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function EditPOPage() {
   const params = useParams()
   const router = useRouter()
   const [activeTab, setActiveTab] = useState<"remarks" | "notes" | "files">("remarks")

   const handleSaveChanges = () => {
      toast.success("Purchase Order updated successfully", {
         description: `Changes to ${params.id || "PO-2024-001"} have been saved.`,
      })
      router.push(`/purchase-order/${params.id || "PO-001"}`)
   }

   return (
      <ContentLayout title={`Edit Purchase Order: ${params.id || "PO-001"}`}>
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
               <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Edit Purchase Order</h1>
               <Badge className="bg-amber-100 text-amber-700 border-none rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider ml-2">Editing Mode</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">

               {/* Left Column: Form Details */}
               <div className="space-y-8">

                  {/* Purchase Source Block (Disabled in Edit) */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden opacity-80">
                     <div className="absolute top-0 right-0 h-2 w-32 bg-zinc-500/5 rounded-bl-full" />
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                           <h3 className="text-xl font-black text-zinc-900 leading-tight">Purchase Source</h3>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Source RFQ and vendor are locked for existing PO</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                           <FileText className="h-5 w-5" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">RFQ / Indent</Label>
                           <Select disabled defaultValue="rfq-001">
                              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold text-zinc-500">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="rfq-001">VPG Grande</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendor Quotation</Label>
                           <Select disabled defaultValue="v1">
                              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold text-zinc-500">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="v1">Supreme Build Tech</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </div>

                  {/* Validity & Delivery Block */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-2 w-32 bg-amber-500/5 rounded-bl-full" />
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                           <h3 className="text-xl font-black text-zinc-900 leading-tight">Validity & Delivery</h3>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Update order validity and expected timeline</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                           <CalendarDays className="h-5 w-5" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid From</Label>
                           <Input type="date" defaultValue="2026-05-12" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-amber-500" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid To</Label>
                           <Input type="date" defaultValue="2024-06-01" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-amber-500" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Est. Delivery Date</Label>
                           <Input type="date" defaultValue="2024-05-15" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-amber-500" />
                        </div>
                     </div>
                  </div>

                  {/* Order Items Block */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                           <h3 className="text-xl font-black text-zinc-900 leading-tight">Order Items</h3>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Edit quantities and pricing if allowed</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-4 py-1 font-black text-[10px]">2 Items</Badge>
                     </div>

                     <div className="rounded-2xl border border-zinc-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                 <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item Information</th>
                                 <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Quantity</th>
                                 <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Unit Price</th>
                                 <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Total Amount</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-50">
                              {[
                                 { name: "Cement Bag", id: "i1", qty: "100", unit: "Bags", price: "420", total: "₹42,000" },
                                 { name: "Sand", id: "i2", qty: "20", unit: "Tons", price: "1,100", total: "₹22,000" },
                              ].map((item, idx) => (
                                 <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                             <Box className="h-5 w-5" />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-sm font-black text-zinc-900">{item.name}</span>
                                             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {item.id}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center justify-center gap-2">
                                          <Input defaultValue={item.qty} className="w-16 h-8 text-center font-black text-xs rounded-lg border-zinc-200" />
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.unit}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center justify-center gap-1">
                                          <span className="text-xs font-black text-zinc-400">₹</span>
                                          <Input defaultValue={item.price} className="w-20 h-8 text-center font-black text-xs rounded-lg border-zinc-200" />
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex flex-col">
                                          <span className="text-sm font-black text-zinc-900">{item.total}</span>
                                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Incl. Tax</span>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

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
                     <div className="p-10">
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
                                    defaultValue="Please ensure all cement bags are from the latest batch. Sand must be double-washed as per site specifications."
                                    className="min-h-[160px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-8 font-bold text-sm focus:ring-teal-500 focus:bg-white transition-all shadow-inner placeholder:text-zinc-300"
                                 />
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
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estimated final amount</p>
                     </div>

                     <div className="space-y-4 pt-4">
                        {[
                           { label: "Subtotal", val: "₹ 64,000" },
                           { label: "Freight & Cartage", val: "₹ 1,200" },
                           { label: "Packing & Forwarding", val: "₹ 500" },
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
                           <span className="text-base font-black text-zinc-900">₹ 65,700</span>
                        </div>

                        <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100/50 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-teal-600 uppercase tracking-tight">GST Amount (18%)</span>
                              <span className="text-[8px] font-black text-teal-500/60 uppercase tracking-widest mt-1">CGST: ₹5,913  SGST: ₹5,913</span>
                           </div>
                           <span className="text-lg font-black text-teal-600">₹ 11,826</span>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-zinc-50 flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">GRAND TOTAL</span>
                           <span className="text-4xl font-black text-zinc-900 tracking-tighter mt-1">₹ 77,526</span>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-xl shadow-teal-500/20">
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
                        defaultValue="Site A - Main Store"
                        className="min-h-[100px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-6 font-bold text-xs focus:ring-teal-500 transition-all shadow-inner"
                     />
                  </div>

                  {/* Save Changes Action */}
                  <Button
                     onClick={handleSaveChanges}
                     className="w-full h-16 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-base gap-3 shadow-xl shadow-teal-500/20 transition-all"
                  >
                     <Save className="h-5 w-5" /> Save Changes
                  </Button>
               </div>
            </div>
         </div>
      </ContentLayout>
   )
}
