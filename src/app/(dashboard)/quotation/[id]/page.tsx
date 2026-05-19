"use client"

import { useParams, useRouter } from "next/navigation"
import {
   ArrowLeft,
   Printer,
   UserPlus,
   Package,
   FileCheck,
   TrendingDown,
   Clock,
   History,
   CheckCircle2,
   MoreVertical,
   Zap
} from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function RFQDetailPage() {
   const params = useParams()
   const router = useRouter()

   const requestedMaterials = [
      { id: "i1", name: "Cement Bag", qty: "50 Bags", estimate: "₹21,000" },
      { id: "i2", name: "TMT Steel 12mm", qty: "5 Tons", estimate: "₹290,000" },
   ]

   const quotations = [
      { id: 1, vendor: "Supreme Build Tech Pvt Ltd", days: "3 DAYS", date: "2024-06-01", amount: "₹310,000", initials: "S", color: "bg-emerald-50 text-emerald-600" },
      { id: 2, vendor: "Elite Materials & Co", days: "5 DAYS", date: "2024-05-30", amount: "₹295,000", initials: "E", color: "bg-blue-50 text-blue-600", highlighted: true },
      { id: 3, vendor: "Modern Builders & Traders", days: "2 DAYS", date: "2024-06-15", amount: "₹305,000", initials: "M", color: "bg-amber-50 text-amber-600" },
   ]

   return (
      <ContentLayout title={`RFQ Detail: ${params.id || "RFQ-2024-001"}`}>
         <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

            {/* Header Navigation */}
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
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">RFQ Detail: RFQ-2024-001</h1>
               </div>
               <div className="flex items-center gap-3">
                  <Button variant="outline" className="h-11 rounded-xl border-zinc-200 font-bold text-xs gap-2 px-6 shadow-sm">
                     <Printer className="h-4 w-4" /> Print RFQ
                  </Button>
                  <Button className="h-11 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-black text-xs gap-2 px-6 shadow-lg shadow-teal-500/20 transition-all">
                     <UserPlus className="h-4 w-4" /> Invite Vendor
                  </Button>
               </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                  { label: "PROJECT", val: "VPG Grande", sub: "Tower A · 4th Floor", color: "text-zinc-600" },
                  { label: "REQUESTER", val: "Ravi Kumar", sub: "Site Manager", color: "text-zinc-600" },
                  { label: "EXPECTED DATE", val: "2024-05-10", sub: "Requested: 2024-05-01", color: "text-zinc-600" },
                  {
                     label: "STATUS", component: (
                        <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest gap-2">
                           <Clock className="h-3.5 w-3.5" /> Awaiting Quotation
                        </Badge>
                     )
                  },
               ].map((card, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col gap-2">
                     <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">{card.label}</span>
                     {card.component ? (
                        <div className="mt-1">{card.component}</div>
                     ) : (
                        <>
                           <span className="text-sm font-black text-zinc-900 tracking-tight leading-none mt-1">{card.val}</span>
                           <span className="text-[10px] font-bold text-zinc-400 leading-none">{card.sub}</span>
                        </>
                     )}
                  </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8">

               {/* Left Column: Details */}
               <div className="space-y-10">

                  {/* Requested Materials */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="h-1.5 w-6 rounded-full bg-[#14b8a6]" />
                        <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Requested Materials</h4>
                     </div>
                     <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                 <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item</th>
                                 <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Quantity</th>
                                 <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Estimate</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-50">
                              {requestedMaterials.map((item) => (
                                 <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                       <div className="flex flex-col">
                                          <span className="text-sm font-black text-zinc-900">{item.name}</span>
                                          <span className="text-[10px] font-bold text-zinc-400">ID: {item.id}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-5">
                                       <div className="flex items-center justify-center">
                                          <span className="bg-zinc-100 px-3 py-1 rounded-lg text-xs font-black text-zinc-600">{item.qty}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                       <span className="text-sm font-black text-zinc-900">{item.estimate}</span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Received Quotations */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="h-1.5 w-6 rounded-full bg-[#14b8a6]" />
                        <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Received Quotations</h4>
                     </div>
                     <div className="space-y-4">
                        {quotations.map((quote) => (
                           <div key={quote.id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-teal-100 transition-all">
                              <div className="flex items-center gap-5">
                                 <Avatar className={cn("h-12 w-12 rounded-xl text-lg font-black", quote.color)}>
                                    <AvatarFallback>{quote.initials}</AvatarFallback>
                                 </Avatar>
                                 <div className="flex flex-col gap-1">
                                    <h5 className="text-sm font-black text-zinc-900 tracking-tight">{quote.vendor}</h5>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                       <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {quote.days}</span>
                                       <span className="flex items-center gap-1"><History className="h-3 w-3" /> {quote.date}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-base font-black text-zinc-900 tracking-tight">{quote.amount}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <Button variant="ghost" className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 hover:bg-rose-50 h-10 px-4 rounded-lg transition-colors">
                                       Reject
                                    </Button>
                                    <Button className="h-10 px-6 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/10 transition-all">
                                       Approve
                                    </Button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Column: Insights & History */}
               <div className="space-y-8">

                  {/* Price Insights Card */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-2 w-32 bg-teal-500/5 rounded-bl-full" />
                     <div className="flex items-center gap-2 relative">
                        <TrendingDown className="h-4 w-4 text-teal-500" />
                        <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Price Insights</h4>
                     </div>

                     <div className="space-y-6">
                        {[
                           { label: "LOWEST BID", val: "₹295,000", sub: "Elite Materials & Co", color: "text-[#14b8a6]", bg: "bg-teal-50/50" },
                           { label: "AVG. PRICE", val: "₹303,333", sub: "Based on 3 bids", color: "text-zinc-900", bg: "bg-zinc-50/50" },
                           { label: "SAVING OPPORTUNITY", val: "₹15,000", sub: "vs. Average price", color: "text-[#14b8a6]", bg: "bg-teal-50/50" },
                        ].map((insight, i) => (
                           <div key={i} className={cn("p-5 rounded-2xl border border-zinc-50 flex flex-col gap-1", insight.bg)}>
                              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{insight.label}</span>
                              <span className={cn("text-xl font-black tracking-tighter", insight.color)}>{insight.val}</span>
                              <span className="text-[10px] font-bold text-zinc-400 italic mt-0.5">{insight.sub}</span>
                           </div>
                        ))}
                     </div>

                     <Button className="w-full h-14 rounded-xl bg-[#14b8a6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:scale-[1.01] transition-all">
                        Generate Report
                     </Button>
                  </div>

                  {/* History Timeline */}
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                     <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">History</h4>
                     </div>

                     <div className="space-y-8 relative pl-4">
                        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-zinc-50 -z-0" />
                        {[
                           { status: "RFQ Created", date: "01 May, 2024", completed: true, color: "bg-teal-500" },
                           { status: "Bids Receiving", date: "In Progress", completed: false, current: true, color: "bg-white border-teal-500 text-teal-500" },
                           { status: "Approval", date: "Pending", completed: false, color: "bg-zinc-50" },
                        ].map((event, i) => (
                           <div key={i} className="flex items-start gap-4 relative z-10">
                              <div className={cn(
                                 "h-5 w-5 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                 event.completed ? event.color :
                                    event.current ? "bg-white border-2 border-teal-500 ring-4 ring-teal-50" :
                                       "bg-zinc-100"
                              )}>
                                 {event.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                                 {event.current && <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                 <span className={cn("text-[11px] font-black tracking-tight", event.completed || event.current ? "text-zinc-900" : "text-zinc-300")}>
                                    {event.status}
                                 </span>
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{event.date}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </ContentLayout>
   )
}
