"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
  Loader2,
  Image as ImageIcon
} from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { purchaseOrderService } from "@/service/purchaseOrderService"
import { exportPurchaseOrderReceipt } from "@/lib/export-receipt"

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
        <div className="flex flex-col items-center justify-center py-40 gap-3 min-h-screen">
          <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 font-bold text-sm">Loading purchase order details...</p>
        </div>
      </ContentLayout>
    )
  }

  if (!po) {
    return (
      <ContentLayout title="Purchase Order Not Found">
        <div className="flex flex-col items-center justify-center py-40 gap-3 min-h-screen">
          <p className="text-zinc-500 font-bold text-sm">Purchase order details could not be found.</p>
          <Button onClick={() => router.push("/purchase-order")}>Go Back</Button>
        </div>
      </ContentLayout>
    )
  }

  const items = po.items || []

  return (
    <ContentLayout title={`Purchase Order Detail: ${po.poNo || "N/A"}`}>
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
              <Button 
                onClick={() => exportPurchaseOrderReceipt(po)} 
                variant="outline" 
                className="h-11 rounded-xl border-zinc-200 font-bold text-xs gap-2 px-6 shadow-sm"
              >
                 <Printer className="h-4 w-4" /> Print
              </Button>
           </div>
        </div>

        {/* Summary Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { 
               label: "Order Date", 
               val: po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A", 
               icon: Calendar, 
               color: "text-teal-500", 
               bg: "bg-teal-50" 
             },
             { 
               label: "Indent Ref", 
               val: po.indentId?.indentId || po.indentId?.indentNo || "N/A", 
               icon: FileText, 
               color: "text-blue-500", 
               bg: "bg-blue-50" 
             },
             { 
               label: "Project", 
               val: po.projectId?.projectName || po.projectId?.name || "N/A", 
               icon: Box, 
               color: "text-amber-500", 
               bg: "bg-amber-50" 
             },
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
                    <Badge className={cn(
                      "rounded-full px-4 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider pointer-events-none",
                      po.status === "Draft" && "bg-zinc-100 text-zinc-600 border-zinc-200",
                      po.status === "PendingApproval" && "bg-amber-50 text-amber-600 border-amber-100",
                      po.status === "Approved" && "bg-blue-50 text-blue-600 border-blue-100",
                      po.status === "Rejected" && "bg-rose-50 text-rose-600 border-rose-100",
                      po.status === "Ordered" && "bg-indigo-50 text-indigo-600 border-indigo-100",
                      po.status === "PartiallyReceived" && "bg-orange-50 text-orange-600 border-orange-100",
                      po.status === "Received" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                      po.status === "Issued" && "bg-teal-50 text-teal-600 border-teal-100",
                      po.status === "Cancelled" && "bg-zinc-50 text-zinc-400 border-zinc-150"
                    )}>
                      {po.status ? po.status.replace(/([A-Z])/g, " $1").trim() : "Pending"}
                    </Badge>
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
                          {items.map((item: any, idx: number) => (
                            <tr key={idx} className="group hover:bg-zinc-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <Box className="h-6 w-6" />
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-sm font-black text-zinc-900 tracking-tight">{item.itemId?.itemName || item.itemId?.name || "Material"}</span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {item.itemId?._id ? item.itemId._id.slice(-6).toUpperCase() : "N/A"}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="bg-zinc-100 px-4 py-1.5 rounded-lg text-xs font-black text-zinc-600">{item.orderQuantity || item.indentQuantity}</span>
                                </td>
                               <td className="px-8 py-6 text-center">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-zinc-900">₹{Number(item.rate || 0).toLocaleString("en-IN")}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-zinc-900">₹{Number(item.amount || ((item.orderQuantity || item.indentQuantity) * (item.rate || 0))).toLocaleString("en-IN")}</span>
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
                       &quot;Please ensure all items match the required project specifications.&quot;
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <FileQuestion className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                          <h4 className="text-sm font-black text-zinc-900 leading-none">Terms & Notes</h4>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase mt-1">Conditions</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       {[
                         "Delivery to the designated project location.",
                         "Verification of quality on site arrival.",
                         "Standard processing times as per organizational policy."
                       ].map((term, i) => (
                          <div key={i} className="flex items-start gap-4">
                             <span className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-[10px] font-black shrink-0">{i+1}</span>
                             <p className="text-xs font-bold text-zinc-600 mt-0.5">{term}</p>
                          </div>
                       ))}
                    </div>
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
                       <h5 className="text-lg font-black text-zinc-900 leading-tight">{po.vendorName}</h5>
                    </div>

                    <div className="space-y-5 pt-4">
                       {[
                         { icon: Phone, val: po.vendorMobile || "No contact info" },
                         { icon: MapPin, val: po.vendorAddress || "No address info" },
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
                      { label: "Subtotal", val: `₹${Number(po.totalAmount || 0).toLocaleString("en-IN")}` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <span className="text-xs font-bold text-zinc-500">{item.label}</span>
                         <span className="text-sm font-black text-zinc-900">{item.val}</span>
                      </div>
                    ))}
                    <div className="h-px bg-zinc-50 my-6" />
                    <div className="flex items-end justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none">Grand Total</span>
                          <span className="text-4xl font-black text-zinc-900 tracking-tighter mt-2">₹{Number(po.totalAmount || 0).toLocaleString("en-IN")}</span>
                       </div>
                    </div>
                 </div>

              </div>

              {/* Attachments / Images Card */}
              {po.images && po.images.length > 0 && (
                 <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                          <ImageIcon className="h-5 w-5" />
                       </div>
                       <h4 className="text-sm font-black text-zinc-900 tracking-tight uppercase tracking-[0.2em]">Attachments</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                                className="flex flex-col items-center justify-center border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition-colors group"
                             >
                                {isPdf ? (
                                   <FileText className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-colors" />
                                ) : (
                                   <img src={fullUrl} alt="PO Attachment" className="h-16 w-16 object-cover rounded-xl" />
                                )}
                                <span className="text-[10px] font-bold text-zinc-500 mt-2 truncate w-full text-center">
                                   {img.split("/").pop()}
                                </span>
                             </a>
                          );
                       })}
                    </div>
                 </div>
              )}           </div>
        </div>
      </div>
    </ContentLayout>
  )
}
