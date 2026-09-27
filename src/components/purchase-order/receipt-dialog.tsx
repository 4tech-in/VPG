"use client";

import { useState } from "react";
import { Printer, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SendWhatsAppDialog, WhatsAppIcon } from "@/components/purchase-order/send-whatsapp-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: any;
  allReceived?: boolean;
  onApprove?: (receiptId: string) => void;
  onReject?: (receiptId: string) => void;
};
const num = (value: unknown) => Number(value || 0);
const date = (value: unknown) => {
  if (!value) return "";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
const time = (value: unknown) => {
  if (!value) return "";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
const person = (value: any) => value?.name || value?.fullName || value?.employeeName || value?.userName || "";

function getFinancialYearString(dateVal?: unknown): string {
  const d = dateVal ? new Date(dateVal as string) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  // Indian financial year runs from April 1 to March 31 (Asia/Kolkata timezone)
  let year = validDate.getFullYear();
  let month = validDate.getMonth() + 1; // 1-12

  try {
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
    }).formatToParts(validDate);

    const yearPart = parts.find((p) => p.type === "year")?.value;
    const monthPart = parts.find((p) => p.type === "month")?.value;
    if (yearPart) year = parseInt(yearPart, 10);
    if (monthPart) month = parseInt(monthPart, 10);
  } catch {
    // Fallback to local
  }

  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = String((fyStart + 1) % 100).padStart(2, "0");
  return `${fyStart}-${fyEnd}`;
}

export function ReceiptDialog({ open, onOpenChange, po, allReceived = false, onApprove, onReject }: Props) {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const receipts = po?.receipts || [];
  const receipt = receipts[receipts.length - 1] || {};
  const receiptItems = receipt.items || [];
  const receiptDate = receipt.receiptDate || receipt.createdAt || po?.createdAt;

  const verificationStatus = String(receipt?.verificationStatus || receipt?.status || (!allReceived ? po?.verificationStatus : "") || "").toLowerCase();
  const isRejected = verificationStatus === "rejected";
  const isApproved = verificationStatus === "approved";
  const isPending = ["pending", "pendingverification"].includes(verificationStatus);

  // Financial Year slip number (format: YYYY-YY/01)
  const getReceiptSlipNo = () => {
    // 1. Direct slipNo on the active receipt
    if (receipt?.slipNo && typeof receipt.slipNo === "string" && receipt.slipNo.trim()) {
      return receipt.slipNo.trim();
    }

    // 2. PO latestSlipNo
    if (po?.latestSlipNo && typeof po.latestSlipNo === "string" && po.latestSlipNo.trim()) {
      return po.latestSlipNo.trim();
    }

    // 3. Check any receipt in receipts array
    const foundWithSlip = [...receipts].reverse().find((r: any) => r?.slipNo);
    if (foundWithSlip?.slipNo && typeof foundWithSlip.slipNo === "string" && foundWithSlip.slipNo.trim()) {
      return foundWithSlip.slipNo.trim();
    }

    // 4. Financial Year calculation fallback: YYYY-YY/01
    const fy = getFinancialYearString(receiptDate);
    const count = String(receipts.length || 1).padStart(2, "0");
    return `${fy}/${count}`;
  };

  const receiptNumber = getReceiptSlipNo();

  const quantityFor = (item: any) => {
    if (allReceived) return num(item.receivedQuantity);
    const id = String(item.itemId?._id || item.itemId || item._id || "");
    const match = receiptItems.find((entry: any) => String(entry.itemId?._id || entry.itemId || "") === id);
    return num(match?.suppliedQuantity ?? match?.receivedQuantity ?? item.receivedQuantity ?? item.orderQuantity ?? item.indentQuantity);
  };

  const sourceItems = allReceived
    ? (po?.items || []).filter((item: any) => num(item.receivedQuantity) > 0)
    : receiptItems.length ? receiptItems : po?.items || [];
  const rows = sourceItems.map((item: any, index: number) => {
    const poItem = (po?.items || []).find((entry: any) => String(entry.itemId?._id || entry.itemId || "") === String(item.itemId?._id || item.itemId || ""));
    const source = poItem || item;
    return {
      key: item._id || source._id || index,
      material: item.itemId?.itemName || item.itemId?.name || source.itemId?.itemName || source.itemId?.name || item.itemName || "Material",
      quantity: quantityFor(source),
      unit: item.unitId?.unitName || item.unitId?.name || source.unitId?.unitName || source.unitId?.name || "",
    };
  });

  const site = po?.projectId?.projectName || po?.projectId?.name || po?.locationAddress || po?.deliveryAddress || po?.projectId?.location || "";
  const vendorName = po?.vendorName || po?.vendorId?.vendorName || po?.vendorId?.companyName || po?.vendorId?.name || "";
  const vehicleNo = receipt?.vehicleNo || receipt?.vehicleNumber || po?.vehicleNo || po?.vehicleNumber || "";
  const requestedBy = person(po?.requestedBy) || person(receipt.receivedBy) || receipt.receiverName || person(po?.receiverMaterial) || "";
  const timeSource = (receipt?.createdAt && !isNaN(new Date(receipt.createdAt).getTime()))
    ? receipt.createdAt
    : receiptDate;
  const formattedDate = date(receiptDate);
  const formattedTime = time(timeSource);

  const printReceipt = () => {
    const node = document.getElementById("material-receipt-print-area");
    if (!node) return;
    const popup = window.open("", "_blank", "width=700,height=900");
    if (!popup) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((item) => item.outerHTML).join("");
    popup.document.write(`<!doctype html><html><head><title>Receipt Slip - ${po?.poNo || "PO"}</title>${styles}<style>@page{size:A5 portrait;margin:8mm}*{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}body{margin:0;background:#fff!important}#material-receipt-print-area{width:100%!important;max-width:none!important;box-shadow:none!important;position:relative!important}.receipt-slip{min-height:190mm!important;padding:8mm!important;position:relative!important;overflow:hidden!important}</style></head><body>${node.outerHTML}</body></html>`);
    popup.document.close();
    popup.focus();
    const imgs = Array.from(popup.document.images);
    if (imgs.length > 0) {
      Promise.all(imgs.map((img) => img.decode().catch(() => {}))).finally(() => {
        window.setTimeout(() => { popup.print(); popup.close(); }, 300);
      });
    } else {
      window.setTimeout(() => { popup.print(); popup.close(); }, 500);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-zinc-100/90 p-0 sm:max-w-[620px] rounded-2xl shadow-2xl border border-zinc-200/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt Slip</DialogTitle>
          <DialogDescription>Material receipt for {po?.poNo}</DialogDescription>
        </DialogHeader>

        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-zinc-900 tracking-tight">Receipt Slip Preview</p>
                {isRejected && (
                  <span className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 shadow-2xs">
                    Rejected
                  </span>
                )}
                {isApproved && (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow-2xs">
                    Approved
                  </span>
                )}
                {isPending && (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 shadow-2xs">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-zinc-500">Official A5 printable material receipt</p>
            </div>
          </div>
          <Button onClick={printReceipt} className="h-8.5 gap-2 bg-zinc-900 hover:bg-zinc-800 px-4 text-xs font-bold text-white shadow-xs rounded-lg active:scale-98 transition-all">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>

        <div id="material-receipt-print-area" className="relative mx-auto my-6 w-[510px] max-w-[calc(100%-28px)] bg-[#fffefa] shadow-xl rounded-sm border border-zinc-300/80 ring-1 ring-black/5">
          <main className="receipt-slip relative min-h-[640px] border border-zinc-400 px-7 py-6 font-sans text-zinc-900 overflow-hidden">
            {isRejected && (
              <div
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center select-none overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="transform -rotate-[30deg] border-4 sm:border-[5px] rounded-2xl px-10 py-4 text-center shadow-lg"
                  style={{
                    borderColor: "rgba(225, 29, 72, 0.42)",
                    backgroundColor: "rgba(255, 241, 242, 0.32)",
                  }}
                >
                  <span
                    className="block text-5xl sm:text-6xl font-black uppercase tracking-[0.25em] font-mono select-none"
                    style={{ color: "rgba(225, 29, 72, 0.45)" }}
                  >
                    REJECTED
                  </span>
                  {receipt?.remark && (
                    <span
                      className="mt-1.5 block max-w-[280px] truncate text-xs font-bold uppercase tracking-wider text-center"
                      style={{ color: "rgba(190, 18, 60, 0.72)" }}
                    >
                      Reason: {receipt.remark}
                    </span>
                  )}
                </div>
              </div>
            )}
            <header className="grid grid-cols-[92px_1fr_138px] items-start gap-2">
              <img src="/vpg.jpeg" alt="VPG logo" className="h-[76px] w-[86px] object-contain grayscale" />
              <p className="pt-3 text-center text-[17px] font-bold uppercase tracking-wide">Receipt Slip</p>
              <div className="pt-1 text-right text-[12px] font-semibold leading-5"><p>M.: 9872307900</p><p>9888889139</p></div>
            </header>

            <h1 className="-mt-1 whitespace-nowrap text-center font-serif text-[25px] font-black leading-tight tracking-tight">VPG Construction Private Limited</h1>

            <table className="mt-3.5 w-full border-collapse text-[12px]">
              <tbody>
                <tr>
                  <td className="w-[110px] py-1 font-bold text-zinc-900 whitespace-nowrap align-top">PO No.</td>
                  <td className="py-1 font-normal text-zinc-900 align-top">{po?.poNo || ""}</td>
                  <td className="w-12 text-right py-1 font-bold text-zinc-900 whitespace-nowrap align-top pr-2">No.</td>
                  <td className="w-32 py-1 text-center align-top border-b border-zinc-700 font-bold tabular-nums whitespace-nowrap text-zinc-900">
                    {receiptNumber}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-zinc-900 whitespace-nowrap align-top">Date</td>
                  <td colSpan={3} className="py-1 font-normal text-zinc-900 align-top">{formattedDate}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-zinc-900 whitespace-nowrap align-top">Time</td>
                  <td colSpan={3} className="py-1 font-normal text-zinc-900 align-top">{formattedTime}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-zinc-900 whitespace-nowrap align-top">Site</td>
                  <td colSpan={3} className="py-1 font-normal text-zinc-900 align-top break-words">{site}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-zinc-900 whitespace-nowrap align-top">Vendor Name</td>
                  <td colSpan={3} className="py-1 font-normal text-zinc-900 align-top break-words">{vendorName}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-zinc-900 whitespace-nowrap align-top">Vehicle No.</td>
                  <td colSpan={3} className="py-1 font-normal text-zinc-900 align-top break-words">{vehicleNo || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-zinc-900 whitespace-nowrap align-top">Requested By</td>
                  <td colSpan={3} className="py-1 font-normal text-zinc-900 align-top break-words">{requestedBy}</td>
                </tr>
              </tbody>
            </table>

            <table className="mt-4 w-full table-fixed border-collapse text-[12px]">
              <thead><tr><th className="w-[58px] border border-zinc-700 px-1 py-1.5 text-center font-bold">Sr. No.</th><th className="border border-zinc-700 px-2 py-1.5 text-center font-bold">Particulars (Name of Material)</th><th className="w-[90px] border border-zinc-700 px-2 py-1.5 text-center font-bold">Qty.</th></tr></thead>
              <tbody>
                {Array.from({ length: Math.max(6, rows.length) }).map((_, index) => {
                  const row = rows[index];
                  if (allReceived && rows.length === 0 && index === 0) {
                    return <tr key="no-received-materials"><td colSpan={3} className="h-8 border border-zinc-700 px-3 py-2 text-center text-zinc-500">No materials received yet.</td></tr>;
                  }
                  return <tr key={row?.key || `empty-${index}`}><td className="h-8 border border-zinc-700 px-2 text-center">{row ? index + 1 : ""}</td><td className="h-8 border border-zinc-700 px-3 font-medium">{row?.material || ""}</td><td className="h-8 border border-zinc-700 px-2 text-center">{row ? `${row.quantity}${row.unit ? ` ${row.unit}` : ""}` : ""}</td></tr>;
                })}
              </tbody>
            </table>

            <footer className="mt-8 grid grid-cols-3 items-end gap-5 text-[12px] font-bold">
              <div>
                <div className="min-h-[40px] flex flex-col justify-end">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Vendor</span>
                  <span className="break-words text-[12px] font-bold text-zinc-900">{vendorName || "—"}</span>
                </div>
                <div className="mt-2 mb-1.5 border-b border-zinc-700" />
                <p className="text-[11px]">Vendor Signature</p>
              </div>
              <div className="text-center">
                <div className="min-h-[40px]" />
                <div className="mt-2 mb-1.5 border-b border-zinc-700" />
                <p className="text-[11px]">Incharge</p>
              </div>
              <div className="flex flex-col items-end text-right">
                <div className="min-h-[40px] flex items-end justify-end">
                  <img
                    src="/image.png"
                    alt="Authorized Signature"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div className="mt-2 mb-1.5 w-full border-b border-zinc-700" />
                <p className="text-[11px]">Rec. Signature</p>
              </div>
            </footer>
          </main>
        </div>

        <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-2xs">
                <XCircle className="h-3.5 w-3.5 text-rose-600" /> Rejected Receipt
              </span>
            )}
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Approved Receipt
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 shadow-2xs">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Verification
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border-zinc-200 shadow-2xs rounded-lg active:scale-98 transition-all"
            >
              Close
            </Button>
            {isPending && receipt?._id && onReject && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onReject(receipt._id)}
                className="h-9 gap-1.5 border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 shadow-2xs rounded-lg active:scale-98 transition-all"
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            )}
            {isPending && receipt?._id && onApprove && (
              <Button
                type="button"
                onClick={() => onApprove(receipt._id)}
                className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs rounded-lg active:scale-98 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            )}
            <Button
              onClick={() => setIsWhatsAppOpen(true)}
              className="h-9 gap-2 bg-[#25D366] hover:bg-[#20ba59] text-xs font-bold text-white shadow-xs rounded-lg active:scale-98 transition-all"
            >
              <WhatsAppIcon className="h-4 w-4" /> Send to Vendor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <SendWhatsAppDialog
      open={isWhatsAppOpen}
      onOpenChange={setIsWhatsAppOpen}
      po={po}
      mode="receipt"
    />
  </>
  );
}
