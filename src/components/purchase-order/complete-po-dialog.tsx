"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { purchaseOrderService, PurchaseOrder } from "@/service/purchaseOrderService";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, PackageX } from "lucide-react";

export function canCompletePurchaseOrder(po: any, currentUser: any): boolean {
  if (!po) return false;

  // 1. Admin user check
  const role = currentUser?.roleId;
  const roleName = String(typeof role === "object" ? role?.name : role || "").toLowerCase();
  const roleScope = typeof role === "object" ? role?.scope : undefined;
  const isAdmin = roleScope === "organization" || ["admin", "superadmin", "super admin"].includes(roleName);
  if (!isAdmin) return false;

  // 2. Normalized status check
  const normalizedStatus = String(po.effectiveStatus ?? po.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  const canShortCloseStatus = new Set([
    "approved",
    "partiallyreceived",
    "partialreceived",
  ]);

  if (!canShortCloseStatus.has(normalizedStatus)) return false;

  // 3. Positive undelivered balance check
  const items = po.items ?? [];
  const hasUndeliveredBalance = items.some((item: any) => {
    const ordered = Number(item.orderQuantity ?? item.indentQuantity ?? 0);
    const received = Number(item.receivedQuantity ?? 0);
    return ordered - received > 0.000001;
  });

  return hasUndeliveredBalance;
}

interface CompletePoDialogProps {
  po: PurchaseOrder | any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CompletePoDialog({
  po,
  open,
  onOpenChange,
  onSuccess,
}: CompletePoDialogProps) {
  const [remark, setRemark] = useState("");
  const [closeIndent, setCloseIndent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!po) return null;

  const items = po.items ?? [];
  const ordered = items.reduce(
    (sum: number, item: any) => sum + Number(item.orderQuantity ?? item.indentQuantity ?? 0),
    0
  );
  const received = items.reduce(
    (sum: number, item: any) => sum + Number(item.receivedQuantity ?? 0),
    0
  );
  const balance = Math.max(ordered - received, 0);

  const handleOpenChange = (isOpen: boolean) => {
    if (isSubmitting) return; // Prevent closing while request is in flight
    if (!isOpen) {
      setRemark("");
      setCloseIndent(false);
    }
    onOpenChange(isOpen);
  };

  const handleComplete = async () => {
    const poId = po._id || po.id;
    if (!poId) return;

    setIsSubmitting(true);
    try {
      const response = await purchaseOrderService.completePurchaseOrder(poId, {
        remark: remark.trim() || undefined,
        closeIndent,
      });

      const message = response?.message || "Purchase order marked as completed successfully";
      toast.success(message);
      onOpenChange(false);
      setRemark("");
      setCloseIndent(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.message || "Purchase order completion failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-950">
            <PackageX className="h-5 w-5 text-amber-600" />
            Complete Purchase Order (Short-Close)
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Mark this purchase order as completed before full receipt. This action is intended for cases where the vendor cannot supply remaining quantities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* PO Details & Quantity Summary */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-500">Purchase Order:</span>
              <span className="font-bold text-zinc-900">{po.poNo || "N/A"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/80 text-center">
              <div className="bg-white p-2 rounded-md border border-zinc-200/60 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Ordered</div>
                <div className="text-sm font-extrabold text-zinc-800">{ordered.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-md border border-zinc-200/60 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Received</div>
                <div className="text-sm font-extrabold text-emerald-700">{received.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-md border border-zinc-200/60 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Balance</div>
                <div className="text-sm font-extrabold text-amber-700">{balance.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Completion Remark */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="po-remark" className="text-xs font-bold text-zinc-700">
                Completion Remark <span className="text-zinc-400 font-normal">(Optional)</span>
              </Label>
              <span className="text-[10px] text-zinc-400 font-medium">
                {remark.length}/500
              </span>
            </div>
            <Textarea
              id="po-remark"
              value={remark}
              maxLength={500}
              disabled={isSubmitting}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Vendor unable to supply remaining items. Short-closing PO."
              className="resize-none text-xs min-h-[75px]"
              rows={3}
            />
          </div>

          {/* Close Linked Indent Checkbox */}
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="close-indent"
                checked={closeIndent}
                disabled={isSubmitting}
                onCheckedChange={(checked) => setCloseIndent(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="grid gap-1 leading-none">
                <Label
                  htmlFor="close-indent"
                  className="text-xs font-bold text-zinc-900 cursor-pointer select-none"
                >
                  Also close linked indent balance
                </Label>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Leave unchecked by default. If enabled, the linked indent&apos;s remaining balance will be permanently closed.
                </p>
              </div>
            </div>

            {closeIndent && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800 border border-amber-200/80 mt-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-medium text-[11px] leading-tight">
                  The unsupplied indent balance will be permanently closed. No further purchase orders can be created for this balance.
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
            className="font-semibold text-xs"
          >
            Keep PO Active
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleComplete}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Complete PO
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
