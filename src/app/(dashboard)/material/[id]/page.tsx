"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Calendar,
  Clock,
  FileText,
  Box,
  Check,
  MessageSquare,
  FileQuestion,
  ShieldCheck,
  Trash2,
  Copy,
  ChevronDown,
  User,
  Phone,
  MapPin,
  FolderOpen,
  Truck,
  DollarSign,
  UserCheck,
  Building,
  Loader2,
  ClipboardCheck
} from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { purchaseOrderService } from "@/service/purchaseOrderService";
import { exportPurchaseOrderReceipt } from "@/lib/export-receipt";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationSheet } from "@/components/purchase-order/verification-sheet";
import { materialIssueService } from "@/service/materialIssue.api";

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [po, setPo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isVerificationSheetOpen, setIsVerificationSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiveData, setReceiveData] = useState<
    {
      itemId: string;
      suppliedQuantity: number;
      remaining: number;
      name: string;
    }[]
  >([]);
  const [issueData, setIssueData] = useState<
    {
      itemId: string;
      suppliedQuantity: number;
      remaining: number;
      name: string;
    }[]
  >([]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await materialIssueService.getMaterialUsageHistory({
        projectId: po?.projectId?._id || po?.projectId
      });
      setHistoryData(res.data || res || []);
    } catch (err) {
      toast.error("Failed to fetch history");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchPO = async () => {
    try {
      const res = await purchaseOrderService.getPurchaseOrderById(
        params.id as string
      );
      setPo(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (params.id) {
      setIsLoading(true);
      fetchPO().finally(() => setIsLoading(false));
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <ContentLayout title="Loading Purchase Order...">
        <div className="flex flex-col items-center justify-center py-20 gap-2 min-h-screen">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 font-bold text-xs">
            Loading purchase order details...
          </p>
        </div>
      </ContentLayout>
    );
  }

  if (!po) {
    return (
      <ContentLayout title="Purchase Order Not Found">
        <div className="flex flex-col items-center justify-center py-20 gap-2 min-h-screen">
          <p className="text-zinc-500 font-bold text-xs">
            Purchase order details could not be found.
          </p>
          <Button size="sm" onClick={() => router.push("/purchase-order")}>
            Go Back
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const items = po.items || [];

  const hasRemainingToReceive = items.some((item: any) => {
    const orderQty = item.orderQuantity || item.indentQuantity || 0;
    const receivedQty = item.receivedQuantity || 0;
    return receivedQty < orderQty;
  });

  const hasRemainingToIssue = items.some((item: any) => {
    const receivedQty = item.receivedQuantity || 0;
    const issuedQty = item.issuedToRequesterQuantity || 0;
    return issuedQty < receivedQty;
  });

  // Calculations
  const calculatedSubtotal = items.reduce((acc: number, item: any) => {
    return (
      acc +
      Number(
        item.amount ||
          (item.orderQuantity || item.indentQuantity) * (item.rate || 0)
      )
    );
  }, 0);

  const isPendingVerification = po.verificationStatus === "PendingVerification";
  const pendingReceipt = po.receipts?.find(
    (r: any) => r.verificationStatus === "Pending"
  );

  const getInitials = (name: string) => {
    if (!name) return "VD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Days left calculation
  const getDaysLeft = () => {
    if (!po.expectedDeliveryDate) return "N/A";
    const diffTime =
      new Date(po.expectedDeliveryDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Delivered / Overdue";
    return `${diffDays} Days Left`;
  };

  // Validity Period Duration Calculation
  const getValidityDays = () => {
    if (!po.validFrom || !po.validTo) return "N/A";
    const diffTime =
      new Date(po.validTo).getTime() - new Date(po.validFrom).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  const handleOpenIssueModal = () => {
    const defaultData = items
      .map((item: any) => {
        const receivedQty = item.receivedQuantity || 0;
        const issuedQty = item.issuedToRequesterQuantity || 0;
        const remaining = Math.max(receivedQty - issuedQty, 0);
        return {
          itemId: item.itemId?._id || item.itemId?.id,
          name: item.itemId?.itemName || item.itemId?.name || "Material",
          suppliedQuantity: remaining,
          remaining
        };
      })
      .filter((i: any) => i.remaining > 0);

    if (defaultData.length === 0) {
      toast.info("All received items have already been fully issued.");
      return;
    }

    setIssueData(defaultData);
    setIsIssueModalOpen(true);
  };

  const handleIssueGoods = async () => {
    try {
      setIsSubmitting(true);
      const validItems = issueData.filter(
        (i) => Number(i.suppliedQuantity) > 0
      );
      if (validItems.length === 0) {
        toast.error(
          "Please enter a valid issue quantity for at least one item."
        );
        return;
      }

      await purchaseOrderService.issueMaterialToRequester(po._id || po.id, {
        items: validItems.map((i) => ({
          itemId: i.itemId,
          supplyQuantity: Number(i.suppliedQuantity)
        }))
      });
      toast.success("Material issued successfully.");
      setIsIssueModalOpen(false);
      await fetchPO();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateIssueQty = (index: number, val: string) => {
    setIssueData((prev) => {
      const copy = [...prev];
      copy[index].suppliedQuantity = Number(val);
      return copy;
    });
  };

  const handleOpenReceiveModal = () => {
    const defaultData = items
      .map((item: any) => {
        const orderQty = item.orderQuantity || item.indentQuantity || 0;
        const receivedQty = item.receivedQuantity || 0;
        const remaining = Math.max(orderQty - receivedQty, 0);
        return {
          itemId: item.itemId?._id || item.itemId?.id,
          name: item.itemId?.itemName || item.itemId?.name || "Material",
          suppliedQuantity: remaining,
          remaining
        };
      })
      .filter((i: any) => i.remaining > 0);

    if (defaultData.length === 0) {
      toast.info("All items have already been fully received.");
      return;
    }

    setReceiveData(defaultData);
    setIsReceiveModalOpen(true);
  };

  const handleReceiveGoods = async () => {
    try {
      setIsSubmitting(true);
      const validItems = receiveData.filter(
        (i) => Number(i.suppliedQuantity) > 0
      );
      if (validItems.length === 0) {
        toast.error(
          "Please enter a valid received quantity for at least one item."
        );
        return;
      }

      await purchaseOrderService.submitGoodsReceipt(po._id || po.id, {
        items: validItems.map((i) => ({
          itemId: i.itemId,
          suppliedQuantity: Number(i.suppliedQuantity)
        }))
      });
      toast.success(
        "Receipt submitted successfully. Waiting for Admin Verification."
      );
      setIsReceiveModalOpen(false);
      await fetchPO();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit goods receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReceiveQty = (index: number, val: string) => {
    setReceiveData((prev) => {
      const copy = [...prev];
      copy[index].suppliedQuantity = Number(val);
      return copy;
    });
  };

  return (
    <ContentLayout title={`Material Receipt Ledger`}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1500px] mx-auto min-h-screen bg-slate-50/50">
        {/* Top Sticky Bar */}
        <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/material")}
                className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                INWARD LEDGER
              </h1>
              <Badge
                className={cn(
                  "rounded-md px-2 py-0.5 font-bold text-[10px] border shadow-sm uppercase tracking-widest",
                  po.status === "Received" ||
                    po.status === "Completed" ||
                    po.status === "Issued"
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {po.status || "Pending"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 pl-11 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-indigo-400" />{" "}
                {po.projectId?.projectName || po.projectId?.name || "N/A"}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-400" /> {po.vendorName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!["Cancelled", "Received", "Rejected", "Completed"].includes(
              po.status
            ) &&
              !isPendingVerification &&
              hasRemainingToReceive && (
                <Button
                  onClick={handleOpenReceiveModal}
                  className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md px-6"
                >
                  + Receive Shipment
                </Button>
              )}
            {isPendingVerification && (
              <Button
                onClick={() => setIsVerificationSheetOpen(true)}
                className="h-10 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md px-6"
              >
                Verify Receipt
              </Button>
            )}
            {["PartiallyReceived", "Received", "Completed", "Issued"].includes(
              po.status
            ) &&
              hasRemainingToIssue && (
                <Button
                  onClick={handleOpenIssueModal}
                  className="h-10 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md px-6"
                >
                  Issue to Site
                </Button>
              )}
            <Button
              onClick={() => {
                fetchHistory();
                setIsHistoryModalOpen(true);
              }}
              variant="outline"
              className="h-10 border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-wider rounded-lg px-4 text-slate-600"
            >
              History
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {isPendingVerification && (
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-xl p-4 flex flex-col gap-1 shadow-sm">
            <h3 className="text-orange-800 font-black text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Admin Verification
            </h3>
            <p className="text-orange-700 font-semibold text-xs max-w-3xl">
              Goods receipt submitted. Waiting for verification before updating
              stock.
            </p>
          </div>
        )}

        {/* Quick Stats Horizontal Row */}
        <div className="bg-white rounded-xl border border-slate-200/70 p-1 shadow-sm grid grid-cols-4 gap-1">
          {[
            {
              label: "Ordered",
              val: items.reduce(
                (acc: number, item: any) => acc + (item.orderQuantity || 0),
                0
              ),
              color: "text-slate-700"
            },
            {
              label: "Received",
              val: items.reduce(
                (acc: number, item: any) => acc + (item.receivedQuantity || 0),
                0
              ),
              color: "text-teal-600"
            },
            {
              label: "Pending",
              val: items.reduce(
                (acc: number, item: any) =>
                  acc +
                  Math.max(
                    (item.orderQuantity || 0) - (item.receivedQuantity || 0),
                    0
                  ),
                0
              ),
              color: "text-amber-500"
            },
            {
              label: "Issued",
              val: items.reduce(
                (acc: number, item: any) => acc + (item.issuedToRequesterQuantity || 0),
                0
              ),
              color: "text-indigo-500"
            }
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-50 p-4 rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-100"
            >
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </span>
              <span className={cn("text-2xl font-black", stat.color)}>
                {stat.val}
              </span>
            </div>
          ))}
        </div>

        {/* 3-Panel Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (Left 2 columns) */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Inventory Progress Overview */}
            <div className="bg-white rounded-xl border border-slate-200/70 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Check className="h-5 w-5 text-teal-500" /> Fulfillment
                  Progress
                </h4>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">
                  {Math.round(
                    (items.reduce(
                      (acc: number, item: any) => acc + (item.receivedQuantity || 0),
                      0
                    ) /
                      Math.max(
                        items.reduce(
                          (acc: number, item: any) => acc + (item.orderQuantity || 0),
                          0
                        ),
                        1
                      )) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{
                    width: `${Math.round(
                      (items.reduce(
                        (acc: number, item: any) => acc + (item.receivedQuantity || 0),
                        0
                      ) /
                        Math.max(
                          items.reduce(
                            (acc: number, item: any) => acc + (item.orderQuantity || 0),
                            0
                          ),
                          1
                        )) *
                        100
                    )}%`
                  }}
                />
              </div>
            </div>

            {/* Material Manifest List */}
            <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200/70 p-4 flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Box className="h-4 w-4 text-indigo-500" /> Material Manifest
                </h4>
                <span className="bg-white text-slate-600 font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-slate-200">
                  {items.length} Items
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item: any, idx: number) => {
                  const ordered =
                    item.orderQuantity || item.indentQuantity || 0;
                  const received = item.receivedQuantity || 0;
                  const issued = item.issuedToRequesterQuantity || 0;
                  const percent = Math.min(
                    Math.round((received / Math.max(ordered, 1)) * 100),
                    100
                  );

                  return (
                    <div
                      key={idx}
                      className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                          <Box className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-slate-900 tracking-tight">
                            {item.itemId?.itemName ||
                              item.itemId?.name ||
                              "Material"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Unit:{" "}
                            <span className="text-slate-600">
                              {item.unitId?.name || "Nos"}
                            </span>{" "}
                            | Spec:{" "}
                            <span className="text-slate-600">
                              {item.specification || "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 min-w-[250px]">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>Received</span>
                            <span>
                              {received} / {ordered}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-400 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Available
                          </span>
                          <span className="text-lg font-black text-amber-600">
                            {Math.max(received - issued, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Panel (Right Column) */}
          <div className="col-span-1 space-y-6">
            {/* Vendor Details */}
            <div className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                  <User className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  Vendor Info
                </h4>
              </div>
              <div className="space-y-3 pl-1">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Vendor Name
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {po.vendorName}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Contact
                    </p>
                    <p className="text-xs font-semibold text-slate-600">
                      {po.vendorMobile || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics & Status */}
            <div className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-sm space-y-5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> Logistics Timeline
              </h4>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 font-bold" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">
                      Order Placed
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {po.createdAt
                        ? new Date(po.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      po.expectedDeliveryDate
                        ? "bg-amber-100 text-amber-600"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    <Truck className="h-3 w-3 font-bold" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">
                      Expected Arrival
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {po.expectedDeliveryDate
                        ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks Box inside Sidebar */}
              {(po.remark || po.notes) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Remarks & Terms
                  </h5>
                  <p className="text-[11px] font-bold text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {po.remark || po.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Receive Goods Modal */}
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Receive Goods</DialogTitle>
            <DialogDescription>
              Enter the quantity received for each remaining item.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {receiveData.map((item, idx) => (
              <div
                key={item.itemId}
                className="flex flex-col gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-800 truncate pr-2">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    Remaining: {item.remaining}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-zinc-600 font-semibold w-24">
                    Received Qty:
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={item.remaining}
                    value={item.suppliedQuantity}
                    onChange={(e) => updateReceiveQty(idx, e.target.value)}
                    className="h-9 font-bold flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReceiveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleReceiveGoods}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Confirm Receipt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Issue Material Modal */}
      <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Issue Material to Requester</DialogTitle>
            <DialogDescription>
              Enter the quantity to issue for each item. You can only issue what
              has been received in stock.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {issueData.map((item, idx) => (
              <div
                key={item.itemId}
                className="flex flex-col gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-800 truncate pr-2">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    Available: {item.remaining}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-zinc-600 font-semibold w-24">
                    Issue Qty:
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={item.remaining}
                    value={item.suppliedQuantity}
                    onChange={(e) => updateIssueQty(idx, e.target.value)}
                    className="h-9 font-bold flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsIssueModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleIssueGoods}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Confirm Issue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Verification Sheet */}
      <VerificationSheet
        po={po}
        isOpen={isVerificationSheetOpen}
        onClose={() => setIsVerificationSheetOpen(false)}
        onSuccess={() => {
          fetchPO();
        }}
      />

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-4xl rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-zinc-900 tracking-tight">
              Material Usage History
            </DialogTitle>
            <DialogDescription className="font-bold text-xs uppercase tracking-widest text-zinc-400">
              Activity log for materials in this project.
            </DialogDescription>
          </DialogHeader>
          {isHistoryLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {historyData.length === 0 ? (
                <div className="text-center p-8 text-zinc-500 font-bold text-sm bg-zinc-50 rounded-2xl border border-zinc-100">
                  No usage history found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-zinc-600 font-black uppercase text-[10px] tracking-widest border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Photo</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3">Recorded By</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {historyData.map((h, i) => (
                        <tr
                          key={i}
                          className="hover:bg-zinc-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-zinc-600">
                            {h.createdAt
                              ? new Date(h.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-4 py-3 font-bold text-zinc-900">
                            {h.itemId?.itemName ||
                              h.itemId?.name ||
                              "Unknown Item"}
                          </td>
                          <td className="px-4 py-3 font-black text-primary">
                            {h.quantityUsed}
                          </td>
                          <td className="px-4 py-3">
                            {h.photo ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_BASE_URL?.replace("/api/", "") || "http://localhost:9090"}${h.photo}`}
                                alt="Usage"
                                className="h-10 w-10 object-cover rounded-lg border border-zinc-200 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() =>
                                  window.open(
                                    `${process.env.NEXT_PUBLIC_BASE_URL?.replace("/api/", "") || "http://localhost:9090"}${h.photo}`,
                                    "_blank"
                                  )
                                }
                              />
                            ) : (
                              <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                                <span className="text-[8px] font-bold text-zinc-400">
                                  N/A
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {h.location ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-zinc-600 font-medium whitespace-nowrap">
                                  {h.location.address || "Unknown"}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">
                                  {h.location.latitude?.toFixed(4)},{" "}
                                  {h.location.longitude?.toFixed(4)}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-zinc-600">
                            {h.taskId?.title || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-zinc-500">
                            {h.recordedBy?.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {h.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
}
