"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SendWhatsAppDialog, WhatsAppIcon } from "@/components/purchase-order/send-whatsapp-dialog";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; po: any };
const num = (value: unknown) => Number(value || 0);
const date = (value: unknown) => value ? new Date(value as string).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const time = (value: unknown) => value ? new Date(value as string).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
const person = (value: any) => value?.name || value?.fullName || value?.employeeName || value?.userName || "";

export function ReceiptDialog({ open, onOpenChange, po }: Props) {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const receipts = po?.receipts || [];
  const receipt = receipts[receipts.length - 1] || {};
  const receiptItems = receipt.items || [];
  const receiptDate = receipt.receiptDate || receipt.createdAt || new Date().toISOString();

  const quantityFor = (item: any) => {
    const id = String(item.itemId?._id || item.itemId || item._id || "");
    const match = receiptItems.find((entry: any) => String(entry.itemId?._id || entry.itemId || "") === id);
    return num(match?.suppliedQuantity ?? match?.receivedQuantity ?? item.receivedQuantity ?? item.orderQuantity ?? item.indentQuantity);
  };

  const sourceItems = receiptItems.length ? receiptItems : po?.items || [];
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
  const vehicleNo = po?.vehicleNo || po?.vehicleNumber || receipt?.vehicleNo || receipt?.vehicleNumber || "";
  const receivedBy = person(receipt.receivedBy) || receipt.receiverName || person(po?.requesterId) || person(po?.requestedBy);

  const printReceipt = () => {
    const node = document.getElementById("material-receipt-print-area");
    if (!node) return;
    const popup = window.open("", "_blank", "width=700,height=900");
    if (!popup) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((item) => item.outerHTML).join("");
    popup.document.write(`<!doctype html><html><head><title>Receipt Slip - ${po?.poNo || "PO"}</title>${styles}<style>@page{size:A5 portrait;margin:8mm}*{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}body{margin:0;background:#fff!important}#material-receipt-print-area{width:100%!important;max-width:none!important;box-shadow:none!important}.receipt-slip{min-height:190mm!important;padding:8mm!important}</style></head><body>${node.outerHTML}</body></html>`);
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
      <DialogContent className="max-h-[95vh] overflow-y-auto bg-stone-200 p-0 sm:max-w-[640px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt Slip</DialogTitle>
          <DialogDescription>Material receipt for {po?.poNo}</DialogDescription>
        </DialogHeader>

        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-5 py-3 shadow-sm">
          <div><p className="text-sm font-extrabold text-zinc-900">Receipt Slip Preview</p><p className="text-[11px] text-zinc-500">A5 printable material receipt</p></div>
          <Button onClick={printReceipt} className="h-9 gap-2 bg-zinc-900 px-4 text-xs font-bold text-white"><Printer className="h-4 w-4" /> Print</Button>
        </div>

        <div id="material-receipt-print-area" className="mx-auto my-5 w-[520px] max-w-[calc(100%-24px)] bg-[#fffefa] shadow-xl">
          <main className="receipt-slip min-h-[640px] border border-zinc-400 px-7 py-6 font-sans text-zinc-900">
            <header className="grid grid-cols-[92px_1fr_138px] items-start gap-2">
              <img src="/vpg.jpeg" alt="VPG logo" className="h-[76px] w-[86px] object-contain grayscale" />
              <p className="pt-3 text-center text-[17px] font-bold uppercase tracking-wide">Receipt Slip</p>
              <div className="pt-1 text-right text-[12px] font-semibold leading-5"><p>M.: 9872307900</p><p>9888889139</p></div>
            </header>

            <h1 className="-mt-1 whitespace-nowrap text-center font-serif text-[25px] font-black leading-tight tracking-tight">VPG Construction Private Limited</h1>

            <table className="mt-3.5 w-full table-fixed border-collapse text-[12px] font-semibold">
              <tbody>
                <tr>
                  <td className="w-16 py-1 whitespace-nowrap text-zinc-800">PO No.</td>
                  <td className="border-b border-zinc-700 px-2 py-1 font-normal text-zinc-900">{po?.poNo || ""}</td>
                  <td className="w-10 text-right py-1 pr-2 text-zinc-800">No.</td>
                  <td className="w-20 border-b border-zinc-700 py-1 font-normal"></td>
                </tr>
               
                <tr>
                  <td className="py-1 whitespace-nowrap text-zinc-800">Vehicle No.</td>
                  <td colSpan={3} className="border-b border-zinc-700 px-2 py-1 font-normal text-zinc-900">{vehicleNo || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 whitespace-nowrap text-zinc-800">Site</td>
                  <td colSpan={3} className="border-b border-zinc-700 px-2 py-1 font-normal text-zinc-900">{site}</td>
                </tr>
                <tr>
                  <td className="py-1 whitespace-nowrap text-zinc-800">Vendor Name</td>
                  <td colSpan={3} className="border-b border-zinc-700 px-2 py-1 font-normal text-zinc-900">{vendorName}</td>
                </tr>
                <tr>
                  <td className="py-1 whitespace-nowrap text-zinc-800">Received By</td>
                  <td colSpan={3} className="border-b border-zinc-700 px-2 py-1 font-normal text-zinc-900">{receivedBy}</td>
                </tr>
              </tbody>
            </table>

            <table className="mt-4 w-full table-fixed border-collapse text-[12px]">
              <thead><tr><th className="w-[58px] border border-zinc-700 px-1 py-1.5 text-center font-bold">Sr. No.</th><th className="border border-zinc-700 px-2 py-1.5 text-center font-bold">Particulars (Name of Material)</th><th className="w-[90px] border border-zinc-700 px-2 py-1.5 text-center font-bold">Qty.</th></tr></thead>
              <tbody>
                {Array.from({ length: Math.max(6, rows.length) }).map((_, index) => {
                  const row = rows[index];
                  return <tr key={row?.key || `empty-${index}`}><td className="h-8 border border-zinc-700 px-2 text-center">{row ? index + 1 : ""}</td><td className="h-8 border border-zinc-700 px-3 font-medium">{row?.material || ""}</td><td className="h-8 border border-zinc-700 px-2 text-center">{row ? `${row.quantity}${row.unit ? ` ${row.unit}` : ""}` : ""}</td></tr>;
                })}
              </tbody>
            </table>

            <footer className="mt-8 grid grid-cols-3 items-end gap-5 text-[12px] font-bold">
              <div>
                <div className="min-h-[40px] flex flex-col justify-end">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Vendor</span>
                  <span className="truncate text-[12px] font-bold text-zinc-900">{vendorName || "—"}</span>
                  {vehicleNo ? (
                    <span className="text-[10px] font-medium text-zinc-600">Veh. No: {vehicleNo}</span>
                  ) : null}
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

        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-bold">Close</Button>
          <Button
            onClick={() => setIsWhatsAppOpen(true)}
            className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm"
          >
            <WhatsAppIcon className="h-4 w-4" /> Send to Vendor
          </Button>
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
