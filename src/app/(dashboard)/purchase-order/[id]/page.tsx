"use client"

import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Mail, 
  Pencil, 
  FileDown, 
  FileText, 
  Calendar, 
  Box, 
  MessageSquare, 
  FileQuestion, 
  User, 
  Phone, 
  MapPin, 
  Send,
  Download,
  Image as ImageIcon
} from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function PODetailPage() {
  const params = useParams()
  const router = useRouter()

  return (
    <ContentLayout title={`Purchase Order Detail: ${params.id || "PO-001"}`}>
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full border-zinc-200 hover:bg-zinc-50 shadow-sm"
              >
                 <ArrowLeft className="h-5 w-5 text-zinc-600" />
              </Button>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Purchase Order Detail</h1>
           </div>
           <div className="flex items-center gap-3">
              <Button variant="outline" className="h-11 rounded-xl border-zinc-200 font-bold text-xs gap-2 px-6 shadow-sm">
                 <Printer className="h-4 w-4" /> Print
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border-zinc-200 font-bold text-xs gap-2 px-6 shadow-sm">
                 <Share2 className="h-4 w-4" /> Share Link
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border-zinc-200 font-bold text-xs gap-2 px-6 shadow-sm">
                 <Mail className="h-4 w-4" /> Send Mail
              </Button>
              <Button 
                onClick={() => router.push(`/purchase-order/${params.id || "PO-001"}/edit`)}
                className="h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs gap-2 px-6 shadow-lg shadow-amber-500/20"
              >
                 <Pencil className="h-4 w-4" /> Edit PO
              </Button>
              <Button className="h-11 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-black text-xs gap-2 px-6 shadow-lg shadow-teal-500/20">
                 <FileDown className="h-4 w-4" /> Export PDF
              </Button>
           </div>
        </div>

        {/* Summary Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Order Date", val: "2024-05-02", icon: Calendar, color: "text-teal-500", bg: "bg-teal-50" },
             { label: "Indent Ref", val: "IND-001", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
             { label: "Exp. Delivery", val: "2024-05-15", icon: Box, color: "text-amber-500", bg: "bg-amber-50" },
           ].map((card, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-5">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", card.bg)}>
                   <card.icon className={cn("h-6 w-6", card.color)} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">{card.label}</span>
                   <span className="text-sm font-black text-zinc-900 mt-2 leading-none tracking-tight">{card.val}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
           
           {/* Left Column: List & Notes */}
           <div className="space-y-10">
              
              {/* Material List Table */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-1.5 w-6 rounded-full bg-[#14b8a6]" />
                       <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Material List</h4>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-4 py-1 font-black text-[10px]">● Sent</Badge>
                 </div>
                 <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-zinc-50/50 border-b border-zinc-100">
                             <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item Information</th>
                             <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Quantity</th>
                             <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Unit Price</th>
                             <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Total Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-50">
                          {[
                            { name: "Cement Bag", id: "i1", qty: "50 Bags", price: "₹420", total: "₹21,000" },
                            { name: "Sand", id: "i2", qty: "10 Tons", price: "₹1,200", total: "₹12,000" },
                          ].map((item, idx) => (
                            <tr key={idx} className="group hover:bg-zinc-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <Box className="h-6 w-6" />
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-sm font-black text-zinc-900 tracking-tight">{item.name}</span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {item.id}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="bg-zinc-100 px-4 py-1.5 rounded-lg text-xs font-black text-zinc-600">{item.qty}</span>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-zinc-900">{item.price}</span>
                                     <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-0.5">Per Bag</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-zinc-900">{item.total}</span>
                                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Incl. Tax</span>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* Remarks & Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                          <MessageSquare className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                          <h4 className="text-sm font-black text-zinc-900 leading-none">Order Remarks</h4>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase mt-1">Internal Instructions</span>
                       </div>
                    </div>
                    <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100/50 italic text-sm font-bold text-zinc-500 leading-relaxed">
                       &quot;Please ensure all cement bags are from the latest batch. Sand must be double-washed as per site specifications.&quot;
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <FileQuestion className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                          <h4 className="text-sm font-black text-zinc-900 leading-none">Terms & Notes</h4>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase mt-1">3 Conditions</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       {[
                         "Delivery between 9 AM to 5 PM only.",
                         "Unloading labor will be provided by the site team.",
                         "Payment will be processed within 15 days of material verification."
                       ].map((term, i) => (
                         <div key={i} className="flex items-start gap-4">
                            <span className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-[10px] font-black shrink-0">{i+1}</span>
                            <p className="text-xs font-bold text-zinc-600 mt-0.5">{term}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-6 pb-10">
                 <div className="flex items-center gap-3">
                    <div className="h-1.5 w-6 rounded-full bg-[#14b8a6]" />
                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Attachments</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: "Quotation_Final.pdf", size: "121 KB", type: "Pdf", icon: FileText, color: "text-teal-600", bg: "bg-teal-50" },
                      { name: "Site_Layout_Plan.jpg", size: "830 KB", type: "Image", icon: ImageIcon, color: "text-blue-600", bg: "bg-blue-50" },
                    ].map((file, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-teal-100 transition-all cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", file.bg)}>
                               <file.icon className={cn("h-6 w-6", file.color)} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-zinc-900 group-hover:text-teal-600 transition-colors">{file.name}</span>
                               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{file.size} · {file.type}</span>
                            </div>
                         </div>
                         <Download className="h-4 w-4 text-zinc-300 group-hover:text-teal-500 transition-all" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Column: Vendor & Cost Summary */}
           <div className="space-y-8">
              
              {/* Vendor Detail Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-2 w-32 bg-teal-500/5 rounded-bl-full" />
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                       <User className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-black text-zinc-900 tracking-tight uppercase tracking-[0.2em]">Vendor Detail</h4>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="flex flex-col">
                       <h5 className="text-lg font-black text-zinc-900 leading-tight">Supreme Build Tech</h5>
                       <span className="text-xs font-bold text-zinc-400 mt-1">Rajesh Gupta</span>
                    </div>

                    <div className="space-y-5 pt-4">
                       {[
                         { icon: Mail, val: "rajesh@supreme.in" },
                         { icon: Phone, val: "9876543210" },
                         { icon: MapPin, val: "Plot 45, Industrial Area, Phase II, Chandigarh" },
                       ].map((info, i) => (
                         <div key={i} className="flex items-start gap-4">
                            <info.icon className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                            <span className="text-[11px] font-bold text-zinc-600 leading-tight">{info.val}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Cost Summary Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-2 w-32 bg-zinc-500/5 rounded-bl-full" />
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                       <FileText className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-black text-zinc-900 tracking-tight uppercase tracking-[0.2em]">Cost Summary</h4>
                 </div>

                 <div className="space-y-5">
                    {[
                      { label: "Subtotal", val: "₹33,000" },
                      { label: "Freight & Handling", val: "₹1,500" },
                      { label: "Packing Charges", val: "₹500" },
                      { label: "GST (18%)", val: "₹6,300", color: "text-emerald-500" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <span className="text-xs font-bold text-zinc-500">{item.label}</span>
                         <span className={cn("text-sm font-black text-zinc-900", item.color)}>{item.val}</span>
                      </div>
                    ))}
                    <div className="h-px bg-zinc-50 my-6" />
                    <div className="flex items-end justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none">Grand Total</span>
                          <span className="text-4xl font-black text-zinc-900 tracking-tighter mt-2">₹41,300</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4">
                    <Button className="w-full h-14 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/10">
                       Download PDF Copy
                    </Button>
                    <Button variant="outline" className="w-full h-14 rounded-xl border-zinc-200 font-black text-xs uppercase tracking-widest gap-2">
                       <Send className="h-4 w-4" /> Send to Vendor
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ContentLayout>
  )
}
