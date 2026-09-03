"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; po: any };
const num = (value: unknown) => Number(value || 0);
const date = (value: unknown) => value ? new Date(value as string).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const time = (value: unknown) => value ? new Date(value as string).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
const person = (value: any) => value?.name || value?.fullName || value?.employeeName || value?.userName || "";

export function ReceiptDialog({ open, onOpenChange, po }: Props) {
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
    window.setTimeout(() => { popup.print(); popup.close(); }, 500);
  };

  return (
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
          <main className="receipt-slip min-h-[735px] border border-zinc-400 px-7 py-6 font-sans text-zinc-900">
            <header className="grid grid-cols-[92px_1fr_138px] items-start gap-2">
              <img src="/vpg.jpeg" alt="VPG logo" className="h-[76px] w-[86px] object-contain grayscale" />
              <p className="pt-3 text-center text-[17px] font-bold uppercase tracking-wide">Receipt Slip</p>
              <div className="pt-1 text-right text-[12px] font-semibold leading-5"><p>M.: 9872307900</p><p>9888889139</p></div>
            </header>

            <h1 className="-mt-1 whitespace-nowrap text-center font-serif text-[25px] font-black leading-tight tracking-tight">VPG Construction Private Limited</h1>

            <section className="mt-5 space-y-2 text-[13px] font-semibold">
              <div className="flex items-end gap-3"><span>PO No.</span><span className="border-b border-zinc-700 px-2 font-normal">{po?.poNo || ""}</span><span className="ml-auto">No.</span><span className="h-5 w-20 border-b border-zinc-700" /></div>
              <div className="flex items-end gap-2"><span>Date</span><span className="border-b border-zinc-700 px-2 font-normal">{date(receiptDate)}</span></div>
              <div className="flex items-end gap-2"><span>Time</span><span className="border-b border-zinc-700 px-2 font-normal">{time(receiptDate)}</span></div>
              <div className="flex items-end gap-2"><span>Site</span><span className="max-w-[360px] border-b border-zinc-700 px-2 font-normal">{site}</span></div>
              <div className="flex items-end gap-2"><span>Vendor Name</span><span className="max-w-[300px] border-b border-zinc-700 px-2 font-normal">{po?.vendorName || po?.vendorId?.vendorName || po?.vendorId?.name || ""}</span></div>
              <div className="flex items-end gap-2"><span>Received By</span><span className="max-w-[300px] border-b border-zinc-700 px-2 font-normal">{receivedBy}</span></div>
            </section>

            <table className="mt-4 w-full table-fixed border-collapse text-[12px]">
              <thead><tr><th className="w-[58px] border border-zinc-700 px-1 py-2 text-center font-bold">Sr. No.</th><th className="border border-zinc-700 px-2 py-2 text-center font-bold">Particulars (Name of Material)</th><th className="w-[90px] border border-zinc-700 px-2 py-2 text-center font-bold">Qty.</th></tr></thead>
              <tbody>
                {Array.from({ length: Math.max(8, rows.length) }).map((_, index) => {
                  const row = rows[index];
                  return <tr key={row?.key || `empty-${index}`}><td className="h-9 border border-zinc-700 px-2 text-center">{row ? index + 1 : ""}</td><td className="h-9 border border-zinc-700 px-3 font-medium">{row?.material || ""}</td><td className="h-9 border border-zinc-700 px-2 text-center">{row ? `${row.quantity}${row.unit ? ` ${row.unit}` : ""}` : ""}</td></tr>;
                })}
              </tbody>
            </table>

            <footer className="mt-12 grid grid-cols-2 gap-14 text-[13px] font-bold"><div><div className="mb-2 border-b border-zinc-700" /><p>Incharge</p></div><div className="text-right"><div className="mb-2 border-b border-zinc-700" /><p>Rec. Signature</p></div></footer>
          </main>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-3"><Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-bold">Close</Button><Button onClick={printReceipt} className="h-9 gap-2 bg-zinc-900 text-xs font-bold text-white"><Printer className="h-4 w-4" /> Print Receipt</Button></div>
      </DialogContent>
    </Dialog>
  );
}
