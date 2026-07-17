"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, ClipboardCheck, Search } from "lucide-react"
import { purchaseOrderService } from "@/service/purchaseOrderService"
import { VerificationSheet } from "@/components/purchase-order/verification-sheet"
import { Input } from "@/components/ui/input"

export default function PendingVerificationPage() {
  const router = useRouter()
  const [pos, setPos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const [selectedPO, setSelectedPO] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const fetchPending = async () => {
    try {
      setIsLoading(true)
      const res = await purchaseOrderService.getPendingVerifications()
      setPos(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const filteredPOs = pos.filter(po => 
    po.poNo?.toLowerCase().includes(search.toLowerCase()) || 
    po.vendorName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ContentLayout title="Pending Verifications">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1500px] mx-auto min-h-screen">
        <div className="flex items-center gap-1 text-zinc-500 text-[11px] font-bold hover:text-zinc-800 transition-colors">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/purchase-order")}
            className="h-7 px-2 rounded-md text-zinc-500 font-bold hover:bg-zinc-100 flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Purchase Orders</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-3">
              Pending Verifications 
              <Badge className="bg-orange-100 text-orange-700 pointer-events-none">{pos.length}</Badge>
            </h1>
            <p className="text-sm font-bold text-zinc-500">
              Review and approve goods receipts submitted by managers.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search PO No or Vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all font-bold text-xs"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
              <p className="text-zinc-500 font-bold text-xs">Loading pending receipts...</p>
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-400 mb-2">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-zinc-900">All caught up!</h3>
              <p className="text-sm font-bold text-zinc-500 max-w-sm">
                There are no pending goods receipts waiting for verification at this time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">PO Number</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Vendor</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Project</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Receipt Date</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPOs.map((po, idx) => {
                    const pendingReceipt = po.receipts?.find((r: any) => r.verificationStatus === "Pending")
                    return (
                      <tr key={idx} className="hover:bg-orange-50/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-zinc-900 group-hover:text-orange-600 transition-colors">{po.poNo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-zinc-700">{po.vendorName}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-zinc-700">{po.projectId?.projectName || po.projectId?.name || "N/A"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-zinc-700">
                            {pendingReceipt ? new Date(pendingReceipt.receiptDate).toLocaleDateString() : "N/A"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button 
                            onClick={() => {
                              setSelectedPO(po)
                              setIsSheetOpen(true)
                            }}
                            className="h-8 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-[10px] uppercase tracking-wider border-none px-4"
                          >
                            Verify
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <VerificationSheet 
        po={selectedPO} 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        onSuccess={() => {
          fetchPending()
        }}
      />
    </ContentLayout>
  )
}
