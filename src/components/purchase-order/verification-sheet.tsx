"use client"

import { useState } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CheckCircle, Clock, XCircle, FileText } from "lucide-react"
import { purchaseOrderService } from "@/service/purchaseOrderService"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function VerificationSheet({ po, isOpen, onClose, onSuccess }: { po: any, isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeDialog, setActiveDialog] = useState<"approve" | "remaining" | "reject" | null>(null)
  const [remark, setRemark] = useState("")

  if (!po) return null
  
  const pendingReceipt = po.receipts?.find((r: any) => r.verificationStatus === "Pending")
  if (!pendingReceipt) return null

  const handleAction = async (action: "APPROVED" | "REMAINING" | "REJECTED") => {
    if (action === "REJECTED" && !remark) {
      toast.error("Please provide a rejection reason.")
      return
    }

    try {
      setIsSubmitting(true)
      await purchaseOrderService.verifyPurchaseOrderReceipt(po._id || po.id, {
        action,
        remark: remark || (action === "APPROVED" ? "Verified and completed successfully." : "Verified partial delivery. Remaining expected.")
      })
      toast.success(action === "REJECTED" ? "Receipt rejected successfully." : "Receipt verified successfully.")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to verify receipt.")
    } finally {
      setIsSubmitting(false)
      setActiveDialog(null)
      setRemark("")
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-zinc-50/50 p-0">
          <div className="bg-white p-6 border-b border-zinc-200">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-black text-zinc-900">Verify Goods Receipt</SheetTitle>
                <Badge className="bg-orange-100 text-orange-700 pointer-events-none px-2 py-1 uppercase tracking-wider text-[10px]">
                  Pending Verification
                </Badge>
              </div>
              <SheetDescription className="text-xs font-bold text-zinc-500 mt-2 leading-relaxed">
                Review the materials submitted by the manager. Stock will only be updated after approval.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* PO & Vendor Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">PO Number</span>
                <span className="text-sm font-bold text-zinc-900">{po.poNo}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendor</span>
                <span className="text-sm font-bold text-zinc-900">{po.vendorName}</span>
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Receipt Metadata</h4>
              <div className="grid grid-cols-2 gap-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Receipt Date</span>
                  <span className="text-xs font-bold text-zinc-800">{new Date(pendingReceipt.receiptDate).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manager Remark</span>
                  <span className="text-xs font-bold text-zinc-800">{pendingReceipt.remark || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bill/Invoice</span>
                  {pendingReceipt.billPhoto ? (
                    <a href={`${process.env.NEXT_PUBLIC_BASE_URL?.split('/api')[0] || ''}${pendingReceipt.billPhoto}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> View Bill
                    </a>
                  ) : <span className="text-xs font-bold text-zinc-500">Not provided</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Material Photo</span>
                  {pendingReceipt.materialPhoto ? (
                    <a href={`${process.env.NEXT_PUBLIC_BASE_URL?.split('/api')[0] || ''}${pendingReceipt.materialPhoto}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> View Photo
                    </a>
                  ) : <span className="text-xs font-bold text-zinc-500">Not provided</span>}
                </div>
              </div>
            </div>

            {/* Submitted Items */}
            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Submitted Materials</h4>
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-wider text-right">Ordered</th>
                    <th className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-wider text-right">Already Rcvd</th>
                    <th className="px-4 py-2 text-[10px] font-black text-orange-600 uppercase tracking-wider text-right bg-orange-50/50">New Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pendingReceipt.items.map((rItem: any, idx: number) => {
                    const poItem = po.items.find((i: any) => String(i.itemId?._id || i.itemId) === String(rItem.itemId?._id || rItem.itemId))
                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-zinc-800">
                          {rItem.itemId?.itemName || rItem.itemId?.name || poItem?.itemId?.itemName || "Unknown Item"}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-zinc-600 text-right">{poItem?.orderQuantity || 0}</td>
                        <td className="px-4 py-3 text-xs font-bold text-zinc-600 text-right">{poItem?.receivedQuantity || 0}</td>
                        <td className="px-4 py-3 text-xs font-black text-orange-700 text-right bg-orange-50/30">
                          +{rItem.suppliedQuantity}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-200">
              <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-wide gap-2"
                onClick={() => setActiveDialog("approve")}
              >
                <CheckCircle className="h-5 w-5" /> APPROVE & CLOSE PO
              </Button>
              <Button 
                variant="outline"
                className="w-full h-12 border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 font-black text-sm tracking-wide gap-2"
                onClick={() => setActiveDialog("remaining")}
              >
                <Clock className="h-5 w-5" /> APPROVE PARTIAL (WAIT FOR REMAINING)
              </Button>
              <Button 
                variant="outline"
                className="w-full h-12 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-sm tracking-wide gap-2 mt-4"
                onClick={() => setActiveDialog("reject")}
              >
                <XCircle className="h-5 w-5" /> REJECT RECEIPT
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialogs */}
      <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {activeDialog === "approve" && "Approve & Close"}
              {activeDialog === "remaining" && "Approve Partial"}
              {activeDialog === "reject" && "Reject Receipt"}
            </DialogTitle>
            <DialogDescription>
              {activeDialog === "approve" && "Are you sure you want to approve this delivery and mark the Purchase Order as Completed?"}
              {activeDialog === "remaining" && "Are you sure you want to approve this delivery but keep the Purchase Order open for remaining items?"}
              {activeDialog === "reject" && "Please provide a reason for rejecting this receipt. Stock will remain unchanged."}
            </DialogDescription>
          </DialogHeader>

          {(activeDialog === "reject" || activeDialog === "remaining") && (
            <div className="py-4 space-y-2">
              <Label className="text-xs font-bold text-zinc-600">
                {activeDialog === "reject" ? "Rejection Reason (Required)" : "Additional Remarks (Optional)"}
              </Label>
              <Input 
                value={remark} 
                onChange={(e) => setRemark(e.target.value)} 
                placeholder={activeDialog === "reject" ? "e.g., Wrong bill number, damaged goods..." : "e.g., 50 delivered, remaining expected later."}
                className="h-10"
              />
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setActiveDialog(null)} disabled={isSubmitting}>Cancel</Button>
            <Button 
              disabled={isSubmitting} 
              onClick={() => {
                if (activeDialog === "approve") handleAction("APPROVED")
                if (activeDialog === "remaining") handleAction("REMAINING")
                if (activeDialog === "reject") handleAction("REJECTED")
              }} 
              className={cn(
                "text-white font-bold",
                activeDialog === "reject" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
