import { useState } from "react";
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
  slipNo?: string;
};

const itemId = (item: Material) =>
  typeof item.itemId === "string" ? item.itemId : item.itemId?._id;
const itemName = (item?: Material) =>
  typeof item?.itemId === "object"
    ? item.itemId?.itemName || item.itemId?.name
    : undefined;

export function ReceiptHistory({
  receipts = [],
  items = [],
  onViewReceipt,
  onApprove,
  onReject,
  approvedOnly = false,
  title,
  subtitle,
}: {
  receipts?: Receipt[];
  items?: Material[];
  onViewReceipt: (index: number) => void;
  onApprove?: (receiptId: string) => void;
  onReject?: (receiptId: string) => void;
  approvedOnly?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [filterTab, setFilterTab] = useState<"all" | "approved" | "pending">(approvedOnly ? "approved" : "all");

  const approvedList = receipts.filter((receipt) =>
    (receipt.verificationStatus || "").toLowerCase() === "approved"
  );
  const pendingList = receipts.filter((receipt) =>
    ["pending", "pendingverification"].includes((receipt.verificationStatus || "").toLowerCase())
  );

  const displayedReceipts = approvedOnly
    ? approvedList
    : filterTab === "approved"
    ? approvedList
    : filterTab === "pending"
    ? pendingList
    : receipts;

  const pendingCount = pendingList.length;

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-zinc-900 tracking-tight">
              {title || (approvedOnly ? "Approved Receipts" : "Receipt Requests")}
            </h4>
            <p className="mt-0.5 text-xs font-medium text-zinc-500">
              {subtitle || (approvedOnly ? "Verified and inwarded delivery records" : "Delivery records and verification status")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!approvedOnly && receipts.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold text-zinc-600 border border-zinc-200/70">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold",
                  filterTab === "all"
                    ? "bg-white text-zinc-900 shadow-xs font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                )}
              >
                <span>All</span>
                <span className="rounded-full bg-zinc-200/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
                  {receipts.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("approved")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold",
                  filterTab === "approved"
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-zinc-600 hover:text-emerald-700 hover:bg-white/60"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Approved</span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  {approvedList.length}
                </span>
              </button>
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab("pending")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold",
                    filterTab === "pending"
                      ? "bg-white text-amber-700 shadow-xs font-bold"
                      : "text-zinc-600 hover:text-amber-700 hover:bg-white/60"
                  )}
                >
                  <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pending</span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {pendingCount}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {displayedReceipts.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 border border-zinc-100 shadow-2xs">
            <Package className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-zinc-800">
            {approvedOnly ? "No approved receipt requests yet" : filterTab === "approved" ? "No approved receipts found" : filterTab === "pending" ? "No pending receipts found" : "No receipt requests yet"}
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
            {approvedOnly ? "Verified and approved delivery slips will be recorded here." : "Submitted deliveries will appear here with their materials and verification status."}
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500",
              displayedReceipts.length > 6 && "max-h-[500px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_theme(colors.zinc.100)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:bg-zinc-100"
            )}
            role="region"
            aria-label="Receipt requests table, scroll horizontally or vertically to view all records"
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] table-fixed text-left text-xs">
              <caption className="sr-only">All receipt requests for this purchase order</caption>
              <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-xs text-zinc-500 shadow-xs">
                <tr>
                  {["Request / Date", "Status", "Materials", "Remarks", "Documents", "Actions"].map((label) => (
                    <th key={label} scope="col" className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-xs whitespace-nowrap px-3 py-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-600">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {displayedReceipts.map((receipt, index) => {
                  const originalIndex = receipts.indexOf(receipt);
                  const targetIndex = originalIndex >= 0 ? originalIndex : index;
                  const date = receipt.receiptDate || receipt.createdAt;
                  const parsedDate = date ? new Date(date) : null;
                  const status = (receipt.verificationStatus || "").toLowerCase();
                  const pending = ["pending", "pendingverification"].includes(status);
                  const approved = status === "approved";
                  const rejected = status === "rejected";
                  const StatusIcon = pending ? Clock3 : approved ? CheckCircle2 : rejected ? XCircle : ClipboardCheck;
                  return (
                    <tr key={receipt._id || index} className="group align-top transition-colors hover:bg-zinc-50/70">
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black tabular-nums text-zinc-900 text-xs">REQ-{String(targetIndex + 1).padStart(3, "0")}</span>
                          {receipt.slipNo && (
                            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-800 border border-teal-200 shadow-2xs">
                              {receipt.slipNo}
                            </span>
                          )}
                        </div>
                        <span className="mt-1.5 block whitespace-nowrap text-[11px] font-medium text-zinc-500">
                          {parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable"}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-left">
                        <Badge variant="outline" className={cn("gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold shadow-2xs uppercase tracking-wide", pending ? "border-amber-300 bg-amber-50 text-amber-700" : approved ? "border-emerald-300 bg-emerald-50 text-emerald-700" : rejected ? "border-rose-300 bg-rose-50 text-rose-700" : "border-zinc-200 bg-zinc-50 text-zinc-600")}>
                          <StatusIcon className="h-3 w-3" />{pending ? "Pending" : receipt.verificationStatus || "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        {receipt.items?.length ? (
                          <ul className="space-y-2.5">
                            {receipt.items.map((material, materialIndex) => {
                              const id = itemId(material);
                              const orderedItem = id ? items.find((item) => itemId(item) === id) : undefined;
                              const unit = material.unitId?.unitName || material.unitId?.name || orderedItem?.unitId?.unitName || orderedItem?.unitId?.name;
                              return (
                                <li key={materialIndex} className="flex items-start gap-2">
                                  <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 group-hover:text-teal-600 transition-colors" />
                                  <div className="min-w-0">
                                    <span className="block [overflow-wrap:anywhere] font-bold text-zinc-900 text-xs">{itemName(material) || itemName(orderedItem) || id || "Material"}</span>
                                    <span className="mt-0.5 inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-zinc-700 border border-zinc-200/60 shadow-2xs">{material.suppliedQuantity ?? material.receivedQuantity ?? "N/A"}{unit ? ` ${unit}` : ""}</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : <span className="text-zinc-400 font-medium">No materials</span>}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <p className="whitespace-pre-wrap [overflow-wrap:anywhere] leading-5 text-zinc-600 font-medium max-w-[180px] text-xs">{receipt.remark || "—"}</p>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          {[
                            { path: receipt.billPhoto, label: "Bill", Icon: FileText },
                            { path: receipt.materialPhoto, label: "Photo", Icon: ImageIcon },
                          ].map(({ path, label, Icon }) => path && (
                            <a key={label} href={getImageUrl(path)} target="_blank" rel="noreferrer" aria-label={`View ${label.toLowerCase()} for request ${targetIndex + 1}`} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-2xs transition-all hover:border-teal-300 hover:bg-teal-50/70 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
                              <Icon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-teal-600" />{label}<ArrowUpRight className="h-3 w-3 text-zinc-400" />
                            </a>
                          ))}
                          {!receipt.billPhoto && !receipt.materialPhoto && <span className="text-[11px] font-medium text-zinc-400">No documents</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <div className="flex flex-col gap-1.5">
                          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-bold text-zinc-800 border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 shadow-2xs" onClick={() => onViewReceipt(targetIndex)} aria-label={`View receipt for request ${targetIndex + 1}`}>
                            <FileText className="h-3.5 w-3.5 text-zinc-500" />Receipt
                          </Button>
                          {pending && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs active:scale-98 transition-all"
                                disabled={!receipt._id}
                                onClick={() => receipt._id && onApprove && onApprove(receipt._id)}
                                aria-label={`Approve request ${targetIndex + 1}`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 shadow-2xs active:scale-98 transition-all"
                                disabled={!receipt._id}
                                onClick={() => receipt._id && (onReject ? onReject(receipt._id) : (onApprove && onApprove(receipt._id)))}
                                aria-label={`Reject request ${targetIndex + 1}`}
                              >
                                <XCircle className="h-3.5 w-3.5" />Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayedReceipts.length > 6 && (
            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/90 px-4 py-2.5 text-[11px] text-zinc-500">
              <span className="font-semibold text-zinc-700">Showing first 6 records in view &bull; Scroll vertically to view all {displayedReceipts.length}</span>
              <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-bold text-zinc-700">Total: {displayedReceipts.length}</span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
