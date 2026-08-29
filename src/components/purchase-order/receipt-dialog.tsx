"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; po: any };
const num = (value: unknown) => Number(value || 0);
const money = (value: unknown) => num(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const showDate = (value: unknown) => value ? new Date(value as string).toLocaleDateString("en-IN") : "—";

function numberToWords(value: number) {
  if (!value) return "Zero Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
  const three = (n: number) => `${n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred ` : ""}${two(n % 100)}`.trim();
  let n = Math.floor(value);
  const parts: string[] = [];
  if (n >= 10000000) { parts.push(`${three(Math.floor(n / 10000000))} Crore`); n %= 10000000; }
  if (n >= 100000) { parts.push(`${three(Math.floor(n / 100000))} Lakh`); n %= 100000; }
  if (n >= 1000) { parts.push(`${three(Math.floor(n / 1000))} Thousand`); n %= 1000; }
  if (n) parts.push(three(n));
  return `${parts.join(" ")} Only`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid grid-cols-[130px_10px_1fr] gap-1 py-1 text-[11px]"><span className="font-bold">{label}</span><span>:</span><span>{value || "—"}</span></div>;
}

export function ReceiptDialog({ open, onOpenChange, po }: Props) {
  const items = po?.items || [];
  const receipts = po?.receipts || [];
  const receipt = receipts[receipts.length - 1] || {};
  const receiptItems = receipt.items || [];
  const receivedQty = (item: any) => {
    const match = receiptItems.find((entry: any) => String(entry.itemId?._id || entry.itemId) === String(item.itemId?._id || item.itemId));
    return match ? num(match.suppliedQuantity || match.receivedQuantity) : num(item.receivedQuantity);
  };
  const subtotal = items.reduce((sum: number, item: any) => sum + num(item.amount || num(item.orderQuantity || item.indentQuantity) * num(item.rate)), 0);
  const gstPercent = num(po?.gst);
  const gstAmount = subtotal * gstPercent / 100;
  const grandTotal = num(po?.totalAmount) || subtotal + gstAmount;
  const showPaidWatermark = ["Issued", "Completed"].includes(po?.status);

  const printReceipt = () => {
    const node = document.getElementById("material-receipt-print-area");
    if (!node) return;
    const popup = window.open("", "_blank", "width=1100,height=850");
    if (!popup) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((item) => item.outerHTML).join("");
    popup.document.write(`<!doctype html><html><head><title>Material Receipt - ${po?.poNo || "PO"}</title>${styles}<style>@page{size:A4;margin:7mm}body{margin:0;background:#fff!important}[data-no-print]{display:none!important}#material-receipt-print-area{width:100%!important;max-width:none!important;box-shadow:none!important}.receipt-document{padding:7mm!important;min-height:280mm!important}section,table,.signature-row{break-inside:avoid}</style></head><body>${node.outerHTML}</body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => { popup.print(); popup.close(); }, 700);
  };

  const headers = ["SR", "DESCRIPTION", "HSN", "UNIT", "ORDERED QTY", "RECEIVED QTY", "RATE (₹)", "AMOUNT (₹)"];

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[94vh] overflow-y-auto bg-zinc-100 p-0 sm:max-w-[1080px]">
      <DialogHeader className="sr-only"><DialogTitle>Material Receipt</DialogTitle><DialogDescription>Receipt for {po?.poNo}</DialogDescription></DialogHeader>
      <div data-no-print className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div><p className="text-sm font-black">Material Receipt Preview</p><p className="text-[10px] font-semibold text-zinc-400">Review before printing</p></div>
        <Button onClick={printReceipt} className="h-9 gap-2 bg-[#07164f] px-5 text-xs font-black text-white hover:bg-[#0b216f]"><Printer className="h-4 w-4"/> Print Receipt</Button>
      </div>

      <div id="material-receipt-print-area" className="mx-auto w-full max-w-[980px] bg-white shadow-xl">
        <div className="receipt-document relative min-h-[1120px] overflow-hidden bg-white px-10 pb-24 pt-7 font-sans text-zinc-950">
          {showPaidWatermark && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
              <div className="-rotate-[28deg] rounded-2xl border-[10px] border-emerald-600/10 px-16 py-4 text-8xl font-black tracking-[0.18em] text-emerald-600/10">
                PAID
              </div>
            </div>
          )}
          <header className="grid grid-cols-[145px_1fr_310px] items-start gap-4">
            <img src="/vpg.jpeg" alt="VPG Construction logo" className="h-[105px] w-[125px] object-contain"/>
            <div/>
            <div className="flex justify-end gap-4"><div className="space-y-2 pt-1 text-right text-[11px] font-bold"><p>☎ &nbsp;+91 9888889139, +91 9872307900</p><p>✉ &nbsp;admin@vpgconstruction.co.in</p><p>⌖ &nbsp;SCO 27, Kalgidhar Enclave, Baltana(Pb.)</p><p>◎ &nbsp;www.vpgconstruction.co.in</p></div><div className="flex h-24 w-8"><span className="w-3 bg-cyan-500"/><span className="flex-1 bg-[#07164f]"/></div></div>
          </header>

          <div className="mb-4 mt-[-2px] text-center"><h1 className="inline-block border-b-2 border-cyan-500 px-3 pb-1 text-3xl font-black tracking-wide text-[#07164f]">MATERIAL RECEIPT</h1></div>

          <section className="grid grid-cols-2 gap-12 rounded-lg border border-zinc-500 px-7 py-2.5">
            <div><InfoRow label="PO Number" value={po?.poNo}/><InfoRow label="PO Date" value={showDate(po?.createdAt)}/><InfoRow label="Valid To" value={showDate(po?.validTo)}/><InfoRow label="Est. Delivery Date" value={showDate(po?.expectedDeliveryDate)}/></div>
            <div><InfoRow label="Receipt No." value={receipt.receiptNo || receipt._id?.slice(-8).toUpperCase() || "—"}/><InfoRow label="Receipt Date" value={showDate(receipt.receiptDate || receipt.createdAt)}/><InfoRow label="Delivery Challan No." value={receipt.deliveryChallanNo || "—"}/><InfoRow label="Vehicle No." value={receipt.vehicleNo || "—"}/></div>
          </section>

          <section className="mt-3 grid grid-cols-2 border border-zinc-600 text-[11px]">
            <div className="border-r border-zinc-600"><h2 className="bg-[#07164f] px-4 py-1.5 text-xs font-black text-white">VENDOR</h2><div className="px-4 py-1"><InfoRow label="Name" value={po?.vendorName}/><InfoRow label="Address" value={po?.vendorAddress}/><InfoRow label="GST No." value={po?.vendorId?.gstNumber}/></div><h3 className="bg-cyan-600 px-4 py-1 text-xs font-black text-white">BANK DETAILS (VENDOR)</h3><div className="px-4 py-1"><InfoRow label="Bank Name" value={po?.vendorId?.bankName}/><InfoRow label="A/C No." value={po?.vendorId?.accountNumber}/><InfoRow label="IFSC Code" value={po?.vendorId?.ifscCode}/></div></div>
            <div><h2 className="bg-[#07164f] px-4 py-1.5 text-xs font-black text-white">DELIVERED TO</h2><div className="px-4 py-1"><InfoRow label="Name" value="VPG CONSTRUCTION PVT. LTD."/><InfoRow label="Site Address" value={po?.deliveryAddress || po?.projectId?.address || po?.projectId?.location || po?.projectId?.projectName}/><InfoRow label="GST No." value="03AAWCS2873A1ZB"/></div></div>
          </section>

          <section className="mt-3 overflow-hidden border border-zinc-600">
            <table className="w-full border-collapse text-[10px]"><thead className="bg-[#07164f] text-white"><tr>{headers.map((head) => <th key={head} className="border-r border-white/30 px-2 py-2 text-center font-black">{head}</th>)}</tr></thead><tbody>
              {items.map((item: any, index: number) => { const ordered = num(item.orderQuantity || item.indentQuantity); return <tr key={item._id || index} className="border-b border-zinc-400"><td className="border-r border-zinc-400 px-2 py-2 text-center">{index + 1}</td><td className="border-r border-zinc-400 px-3 py-2 font-semibold">{item.itemId?.itemName || item.itemId?.name || "Material"}</td><td className="border-r border-zinc-400 px-2 py-2 text-center">{item.hsnCode || item.itemId?.hsnCode || "—"}</td><td className="border-r border-zinc-400 px-2 py-2 text-center">{item.unitId?.unitName || item.unitId?.name || "Units"}</td><td className="border-r border-zinc-400 px-2 py-2 text-center font-bold">{ordered}</td><td className="border-r border-zinc-400 px-2 py-2 text-center font-black text-cyan-700">{receivedQty(item)}</td><td className="border-r border-zinc-400 px-2 py-2 text-right">{money(item.rate)}</td><td className="px-3 py-2 text-right font-bold">{money(item.amount || ordered * num(item.rate))}</td></tr>; })}
            </tbody></table>
          </section>

          <div className="grid grid-cols-[1fr_340px]"><div className="px-3 pt-7 text-[11px] font-bold">Total (in Words): <span className="text-[#07164f]">{numberToWords(grandTotal)}</span></div><table className="w-full border-collapse text-[11px]"><tbody><tr><td className="border border-t-0 border-zinc-500 px-4 py-2 text-center font-bold">Subtotal</td><td className="border border-t-0 border-zinc-500 px-4 py-2 text-right">₹ {money(subtotal)}</td></tr><tr><td className="border border-zinc-500 px-4 py-2 text-center font-bold">GST {gstPercent}%</td><td className="border border-zinc-500 px-4 py-2 text-right">₹ {money(gstAmount)}</td></tr><tr className="bg-cyan-600 text-white"><td className="border border-cyan-700 px-4 py-2 text-center font-black">Grand Total</td><td className="border border-cyan-700 px-4 py-2 text-right font-black">₹ {money(grandTotal)}</td></tr></tbody></table></div>

          <section className="signature-row mt-4 grid grid-cols-3 border-t border-cyan-500 pt-3 text-center text-[10px]">
            {[{ title: "RECEIVED BY", sub: "Vendor" }, { title: "CHECKED BY", sub: "Site" }, { title: "AUTHORIZED BY", sub: "VPG" }].map((block) => <div key={block.title} className="border-r border-zinc-400 px-8 last:border-0"><p className="mb-3 font-black text-[#07164f]">{block.title} <span className="text-cyan-600">({block.sub})</span></p>{["Name", "Sign", "Date"].map((field) => <p key={field} className="mb-2 flex gap-2 text-left"><b>{field}:</b><span className="flex-1 border-b border-zinc-500"/></p>)}</div>)}
          </section>
          <div className="relative z-10 mt-4 text-center font-serif italic text-[#07164f]"><p className="font-bold">Thank you for your business!</p><p className="text-sm font-bold">For VPG Construction Private Limited</p></div>
          <svg className="pointer-events-none absolute bottom-0 left-0 h-24 w-full" viewBox="0 0 1000 100" preserveAspectRatio="none"><path fill="#06a9d0" d="M0 72 Q610 112 1000 15 V100 H0Z"/><path fill="#07164f" d="M0 72 Q650 112 1000 48 V100 H0Z"/></svg>
        </div>
      </div>
      <div data-no-print className="sticky bottom-0 flex justify-end border-t bg-white px-6 py-3"><Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2 h-9 text-xs font-bold">Close</Button><Button onClick={printReceipt} className="h-9 gap-2 bg-cyan-600 text-xs font-black text-white hover:bg-cyan-700"><Printer className="h-4 w-4"/> Print Receipt</Button></div>
    </DialogContent>
  </Dialog>;
}
