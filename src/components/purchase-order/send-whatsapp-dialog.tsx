"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, MessageSquare, Send, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { purchaseOrderService } from "@/service/purchaseOrderService";
import { generatePurchaseOrderPdf, generateReceiptPdf } from "@/lib/generate-purchase-order-pdf";
import { purchaseOrderPdfFilename } from "@/lib/purchase-order-filename";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WhatsAppIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface SendWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: any;
  onSuccess?: () => void;
  mode?: "po" | "receipt";
}

export function SendWhatsAppDialog({
  open,
  onOpenChange,
  po,
  onSuccess,
  mode = "po",
}: SendWhatsAppDialogProps) {
  const isReceipt = mode === "receipt";
  const [vendorMobile, setVendorMobile] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [attachFile, setAttachFile] = useState(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (po && open) {
      // Auto-populate vendor phone from po if available
      const initialMobile =
        po.vendorMobile ||
        po.vendorId?.contactNumber ||
        po.vendorId?.mobile ||
        "";
      setVendorMobile(initialMobile);
      setCustomMessage("");
      setAttachFile(true);
      setPdfFile(null);
    }
  }, [po, open]);

  useEffect(() => {
    if (!open || !po) return;
    let cancelled = false;
    setPdfFile(null);
    setPdfError("");
    setIsGenerating(true);
    const prepare = async () => {
      try {
        const details = await purchaseOrderService.getPurchaseOrderById(po._id || po.id);
        if (cancelled) return;
        const file = isReceipt
          ? await generateReceiptPdf(details)
          : await generatePurchaseOrderPdf(details);
        if (!cancelled) setPdfFile(file);
      } catch (error) {
        if (!cancelled) setPdfError(error instanceof Error ? error.message : "Could not generate the PDF");
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };
    void prepare();
    return () => { cancelled = true; };
  }, [open, po, generationAttempt, isReceipt]);

  if (!po) return null;

  const poId = po._id || po.id;
  const vendorName = po.vendorName || po.vendorId?.name || "Vendor";
  const poNo = po.poNo || "N/A";
  const cleanVendor = String(vendorName).replace(/[^a-zA-Z0-9_-]/g, "_");
  const latestSlip = po?.latestSlipNo || (po?.receipts && po.receipts[po.receipts.length - 1]?.slipNo);
  const slipIdent = latestSlip ? String(latestSlip).replace(/[^a-zA-Z0-9_-]/g, "-") : poNo;
  const pdfFilename = isReceipt
    ? `Receipt_${slipIdent}_${cleanVendor}.pdf`
    : purchaseOrderPdfFilename(po);
  const amount = po.totalAmount
    ? `₹${Number(po.totalAmount).toLocaleString("en-IN")}`
    : "₹0";

  // Basic mobile sanity check (at least 10 digits when non-digits removed)
  const cleanNumber = vendorMobile.replace(/\D/g, "");
  const isValidNumber = cleanNumber.length >= 10;

  const handleSend = async () => {
    if (!isValidNumber) {
      toast.error("Please enter a valid 10-digit mobile number for the vendor.");
      return;
    }

    setIsSending(true);
    try {
      if (attachFile && !pdfFile) {
        toast.error(`Please wait for the ${isReceipt ? "receipt" : "purchase order"} PDF to finish generating.`);
        return;
      }
      if (attachFile && pdfFile && await pdfFile.slice(0, 5).text() !== "%PDF-") {
        toast.error("The selected file is not a valid PDF.");
        return;
      }
      const defaultMessage = isReceipt
        ? `Receipt Slip${latestSlip ? ` #${latestSlip}` : ""} for ${poNo} - ${vendorName}`
        : undefined;

      const res = await purchaseOrderService.sendPurchaseOrderWhatsApp(poId, {
        phone: vendorMobile.trim(),
        message: customMessage.trim() || defaultMessage,
        pdf: attachFile && pdfFile ? pdfFile : undefined,
        pdfUrl: attachFile ? undefined : "",
      });

      if (res && res.success !== false) {
        toast.success(`${isReceipt ? "Receipt" : "Purchase Order"} ${poNo} sent to ${vendorName} on WhatsApp!`, {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res?.message || "Failed to send WhatsApp message. Please check the vendor number or gateway connection.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error sending WhatsApp notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!isSending) onOpenChange(nextOpen); }}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-zinc-900">
                {isReceipt ? "Send Receipt on WhatsApp" : "Send PO on WhatsApp"}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-zinc-500">
                {isReceipt
                  ? "Deliver the receipt slip & details to the vendor."
                  : "Deliver the purchase order document & details to the vendor."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Info Card */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-500">{isReceipt ? "Receipt Slip:" : "Purchase Order:"}</span>
            <span className="text-zinc-900 font-extrabold">{poNo}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-500">Vendor:</span>
            <span className="text-zinc-900">{vendorName}</span>
          </div>
          {!isReceipt && (
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-500">Total Value:</span>
              <span className="text-emerald-700 font-black">{amount}</span>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendorMobile" className="text-xs font-black text-zinc-700 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-zinc-500" />
              Vendor WhatsApp Number <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="vendorMobile"
              placeholder="e.g. 9876543210"
              value={vendorMobile}
              onChange={(e) => setVendorMobile(e.target.value)}
              className="h-10 rounded-xl font-bold bg-white text-zinc-900 border-zinc-200 focus-visible:ring-emerald-500"
              disabled={isSending}
            />
            <p className="text-[10px] font-medium text-zinc-400">
              Enter 10-digit number. Country code (+91) is handled automatically.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customMessage" className="text-xs font-black text-zinc-700 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
              Custom Note / Caption <span className="text-zinc-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="customMessage"
              placeholder={
                isReceipt
                  ? "Leave empty to send default receipt details and attachment..."
                  : "Leave empty to send default PO details and attachment..."
              }
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="rounded-xl text-xs font-medium bg-white text-zinc-900 border-zinc-200 resize-none min-h-[70px] focus-visible:ring-emerald-500"
              disabled={isSending}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-800">Attach Document / PDF</span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {isReceipt
                    ? "The receipt slip PDF is generated automatically"
                    : "The purchase order PDF is generated automatically"}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              id="attachFile"
              checked={attachFile}
              onChange={(e) => setAttachFile(e.target.checked)}
              disabled={isSending}
              className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
            />
          </div>
          {attachFile && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-zinc-500 break-all">
                {isGenerating
                  ? isReceipt
                    ? "Generating receipt PDF…"
                    : "Generating purchase order PDF…"
                  : pdfFile
                    ? `Ready: ${pdfFile.name}`
                    : `PDF: ${pdfFilename}`}
              </p>
              {pdfError && (
                <>
                  <p role="alert" className="text-xs text-rose-600">{pdfError}</p>
                  <Button variant="outline" disabled={isGenerating || isSending} onClick={() => setGenerationAttempt((attempt) => attempt + 1)}>Retry PDF generation</Button>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 flex items-center gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="rounded-xl font-bold text-xs h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !isValidNumber || (attachFile && !pdfFile)}
            className="rounded-xl font-black text-xs h-10 px-5 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send on WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WhatsAppShareButtonProps {
  po: any;
  variant?: "icon" | "button" | "outline";
  className?: string;
  label?: string;
  onSuccess?: () => void;
  mode?: "po" | "receipt";
}

export function WhatsAppShareButton({
  po,
  variant = "icon",
  className,
  label = "WhatsApp",
  onSuccess,
  mode = "po",
}: WhatsAppShareButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                className={
                  className ||
                  "h-8 w-8 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-all border border-emerald-200/60 shadow-xs"
                }
                aria-label={mode === "receipt" ? "Send receipt via WhatsApp" : "Send purchase order via WhatsApp"}
              >
                <WhatsAppIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mode === "receipt" ? "Send Receipt on WhatsApp" : "Send on WhatsApp"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <SendWhatsAppDialog
          open={open}
          onOpenChange={setOpen}
          po={po}
          onSuccess={onSuccess}
          mode={mode}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant === "outline" ? "outline" : "default"}
        onClick={() => setOpen(true)}
        className={
          className ||
          (variant === "outline"
            ? "h-9 rounded-lg border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 font-bold text-[11px] gap-1.5 px-4 shadow-sm"
            : "h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] gap-1.5 px-4 shadow-sm shadow-emerald-600/20")
        }
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
        {label}
      </Button>

      <SendWhatsAppDialog
        open={open}
        onOpenChange={setOpen}
        po={po}
        onSuccess={onSuccess}
        mode={mode}
      />
    </>
  );
}
