import { ClipboardCheck, Clock3, CheckCircle2, XCircle, FileText, ImageIcon, ArrowUpRight, Package } from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Material = {
  itemId?: string | { _id?: string; itemName?: string; name?: string };
  unitId?: { unitName?: string; name?: string };
  suppliedQuantity?: number;
  receivedQuantity?: number;
};

type Receipt = {
  _id?: string;
  receiptDate?: string;
  createdAt?: string;
  verificationStatus?: string;
  items?: Material[];
  remark?: string;
  billPhoto?: string;
  materialPhoto?: string;
};

const itemId = (item: Material) =>
  typeof item.itemId === "string" ? item.itemId : item.itemId?._id;
const itemName = (item?: Material) =>
  typeof item?.itemId === "object"
    ? item.itemId?.itemName || item.itemId?.name
    : undefined;

export function ReceiptHistory({ receipts = [], items = [], onViewReceipt, onApprove }: {
  receipts?: Receipt[];
  items?: Material[];
  onViewReceipt: (index: number) => void;
  onApprove: (receiptId: string) => void;
}) {
  const pendingCount = receipts.filter((receipt) =>
    ["pending", "pendingverification"].includes((receipt.verificationStatus || "").toLowerCase())
  ).length;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900">Receipt Requests</h4>
            <p className="mt-0.5 text-xs text-zinc-500">Delivery records and verification status</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <Clock3 className="h-3 w-3" />{pendingCount} pending
            </span>
          )}
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">{receipts.length} total</span>
        </div>
      </div>
      {receipts.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400"><Package className="h-6 w-6" /></div>
          <p className="text-sm font-semibold text-zinc-700">No receipt requests yet</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">Submitted deliveries will appear here with their materials and verification status.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="block w-full text-left text-xs md:table md:min-w-[790px]">
            <caption className="sr-only">All receipt requests for this purchase order</caption>
            <thead className="hidden border-b border-zinc-100 bg-zinc-50/80 text-zinc-500 md:table-header-group">
              <tr>
                {["Request / Date", "Status", "Materials", "Remarks", "Documents", "Actions"].map((label) => (
                  <th key={label} scope="col" className="whitespace-nowrap px-5 py-3 text-[10px] font-semibold uppercase tracking-wider">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="block divide-y divide-zinc-100 md:table-row-group">
              {receipts.map((receipt, index) => {
                const date = receipt.receiptDate || receipt.createdAt;
                const parsedDate = date ? new Date(date) : null;
                const status = (receipt.verificationStatus || "").toLowerCase();
                const pending = ["pending", "pendingverification"].includes(status);
                const approved = status === "approved";
                const rejected = status === "rejected";
                const StatusIcon = pending ? Clock3 : approved ? CheckCircle2 : rejected ? XCircle : ClipboardCheck;
                return (
                  <tr key={receipt._id || index} className="grid grid-cols-2 gap-x-3 gap-y-4 p-5 align-top transition-colors hover:bg-zinc-50/50 md:table-row md:p-0">
                    <td className="md:px-5 md:py-5">
                      <span className="font-bold tabular-nums text-zinc-800">REQ-{String(index + 1).padStart(3, "0")}</span>
                      <span className="mt-1.5 block whitespace-nowrap text-[11px] text-zinc-500">
                        {parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable"}
                      </span>
                    </td>
                    <td className="text-right md:px-5 md:py-5 md:text-left">
                      <Badge variant="outline" className={cn("gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-none", pending ? "border-amber-200 bg-amber-50 text-amber-700" : approved ? "border-emerald-200 bg-emerald-50 text-emerald-700" : rejected ? "border-rose-200 bg-rose-50 text-rose-700" : "border-zinc-200 bg-zinc-50 text-zinc-600")}>
                        <StatusIcon className="h-3 w-3" />{pending ? "Pending" : receipt.verificationStatus || "Unknown"}
                      </Badge>
                    </td>
                    <td className="col-span-2 md:px-5 md:py-5">
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 md:hidden">Materials</span>
                      {receipt.items?.length ? (
                        <ul className="space-y-3">
                          {receipt.items.map((material, materialIndex) => {
                            const id = itemId(material);
                            const orderedItem = id ? items.find((item) => itemId(item) === id) : undefined;
                            const unit = material.unitId?.unitName || material.unitId?.name || orderedItem?.unitId?.unitName || orderedItem?.unitId?.name;
                            return (
                              <li key={materialIndex} className="flex items-start gap-2">
                                <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <div className="min-w-0">
                                  <span className="block break-words font-semibold text-zinc-800">{itemName(material) || itemName(orderedItem) || id || "Material"}</span>
                                  <span className="mt-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600">{material.suppliedQuantity ?? material.receivedQuantity ?? "N/A"}{unit ? ` ${unit}` : ""}</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : <span className="text-zinc-400">No materials</span>}
                    </td>
                    <td className="col-span-2 md:px-5 md:py-5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 md:hidden">Remarks</span>
                      <p className="min-w-[100px] whitespace-pre-wrap break-words leading-5 text-zinc-500 md:max-w-[180px]">{receipt.remark || "—"}</p>
                    </td>
                    <td className="col-span-2 md:px-5 md:py-5">
                      <div className="flex flex-wrap gap-2 md:flex-col md:items-start">
                        {[
                          { path: receipt.billPhoto, label: "Bill", Icon: FileText },
                          { path: receipt.materialPhoto, label: "Photo", Icon: ImageIcon },
                        ].map(({ path, label, Icon }) => path && (
                          <a key={label} href={getImageUrl(path)} target="_blank" rel="noreferrer" aria-label={`View ${label.toLowerCase()} for request ${index + 1}`} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
                            <Icon className="h-3.5 w-3.5" />{label}<ArrowUpRight className="h-3 w-3 text-zinc-400" />
                          </a>
                        ))}
                        {!receipt.billPhoto && !receipt.materialPhoto && <span className="text-[11px] text-zinc-400">No documents</span>}
                      </div>
                    </td>
                    <td className="col-span-2 border-t border-zinc-100 pt-3 md:border-0 md:px-5 md:py-5">
                      <div className="flex gap-2 md:flex-col">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onViewReceipt(index)} aria-label={`View receipt for request ${index + 1}`}>
                          <FileText className="h-3.5 w-3.5" />Receipt
                        </Button>
                        {pending && (
                          <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700" disabled={!receipt._id} onClick={() => receipt._id && onApprove(receipt._id)} aria-label={`Approve request ${index + 1}`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
