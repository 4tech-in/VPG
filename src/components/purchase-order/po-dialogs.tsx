"use client";

import { useState, useEffect } from "react";
import { FileText, Box, Loader2, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { indentService } from "@/service/indents.api";
import { vendorService } from "@/service/vendorService";
import { purchaseOrderService } from "@/service/purchaseOrderService";

interface CreatePODialogProps {
  defaultIndentId?: string;
  onSuccess?: () => void;
  trigger: React.ReactNode;
}

export function CreatePODialog({
  defaultIndentId,
  onSuccess,
  trigger
}: CreatePODialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedIndentId, setSelectedIndentId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [activeIndent, setActiveIndent] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [dropLocation, setDropLocation] = useState("");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [freightCharges, setFreightCharges] = useState<number>(0);
  const [packagingCharges, setPackagingCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [gst, setGst] = useState<number>(0);

  // Fetch approved indents & active vendors when Dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        try {
          // If defaultIndentId is passed, we fetch all approved indents but also ensure the default one is fetched/available
          const indentsRes = await indentService.getIndents({
            status: "Approved"
          });
          let loadedIndents = indentsRes.data || indentsRes || [];

          if (
            defaultIndentId &&
            !loadedIndents.some((ind: any) => ind._id === defaultIndentId)
          ) {
            try {
              const defaultIndent =
                await indentService.getIndentById(defaultIndentId);
              if (defaultIndent) {
                loadedIndents = [...loadedIndents, defaultIndent];
              }
            } catch (e) {
              console.error("Failed to fetch default indent", e);
            }
          }

          setIndents(loadedIndents);

          const vendorsRes = await vendorService.getVendors();
          setVendors(vendorsRes.vendors || vendorsRes || []);

          if (defaultIndentId) {
            handleIndentSelect(defaultIndentId);
          }
        } catch (err: any) {
          toast.error("Failed to load indents or vendors data");
        }
      };
      loadInitialData();
    } else {
      // Clear state when closed
      setSelectedIndentId("");
      setSelectedVendorId("");
      setActiveIndent(null);
      setItems([]);
      setDropLocation("");
      setFreightCharges(0);
      setPackagingCharges(0);
      setOtherCharges(0);
      setGst(0);
    }
  }, [isOpen, defaultIndentId]);

  const handleIndentSelect = async (val: string) => {
    setSelectedIndentId(val);
    setSelectedVendorId("");
    setActiveIndent(null);
    setItems([]);

    try {
      const fullIndent = await indentService.getIndentById(val);
      setActiveIndent(fullIndent);

      let alreadyPoItemIds = new Set<string>();
      try {
        const poRes = await purchaseOrderService.getPurchaseOrders({
          indentId: val,
          limit: 1000
        });
        const activePOs = (poRes.data || []).filter(
          (po: any) => po.status !== "Cancelled"
        );
        activePOs.forEach((po: any) => {
          if (Array.isArray(po.items)) {
            po.items.forEach((item: any) => {
              const itemIdStr = String(item.itemId?._id || item.itemId || "");
              if (itemIdStr) {
                alreadyPoItemIds.add(itemIdStr);
              }
            });
          }
        });
      } catch (poErr) {
        console.error("Failed to fetch existing POs for indent", poErr);
      }

      if (fullIndent && Array.isArray(fullIndent.items)) {
        setItems(
          fullIndent.items.map((item: any) => {
            const itemIdStr = String(item.itemId?._id || item.itemId || "");
            const poCreated =
              item.poCreated ||
              item.itemId?.poCreated ||
              alreadyPoItemIds.has(itemIdStr);
            return {
              itemId: itemIdStr,
              name:
                item.itemId?.name || item.itemId?.itemName || "Unknown Item",
              qty: item.quantity,
              unitId: item.unitId?._id || item.unitId || "",
              unit: item.unitId?.name || item.unitId?.unitName || "Pcs",
              price: "",
              description: "",
              poCreated,
              selected: !poCreated
            };
          })
        );
      }
    } catch (err) {
      toast.error("Failed to fetch indent details");
    }
  };

  const handleVendorSelect = (val: string) => {
    setSelectedVendorId(val);
  };

  const handlePriceChange = (idx: number, val: number | string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
    );
  };

  const handleQtyChange = (idx: number, val: number | string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, qty: val } : item))
    );
  };

  const handleDescriptionChange = (idx: number, val: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
    );
  };

  const toggleItemSelection = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const activeVendor = vendors.find(
    (v) => (v._id || v.id) === selectedVendorId
  );

  const subtotal = items
    .filter((item) => item.selected)
    .reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
      0
    );
  const taxableAmount =
    subtotal +
    (Number(freightCharges) || 0) +
    (Number(packagingCharges) || 0) +
    (Number(otherCharges) || 0);
  const grandTotal = taxableAmount + (taxableAmount * (Number(gst) || 0)) / 100;

  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndentId || !selectedVendorId || !activeVendor) {
      toast.error("Please select both indent and vendor");
      return;
    }

    const selectedItems = items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to generate PO");
      return;
    }

    // Ensure all selected items have a valid quantity > 0
    if (selectedItems.some((item) => (Number(item.qty) || 0) <= 0)) {
      toast.error("All selected items must have a quantity greater than 0");
      return;
    }

    setIsFormSubmitting(true);
    try {
      await purchaseOrderService.createPurchaseOrder({
        indentId: selectedIndentId,
        vendorId: selectedVendorId,
        vendorName: activeVendor.name,
        vendorMobile: activeVendor.contactNumber || "",
        vendorAddress: activeVendor.address || "",
        items: selectedItems.map((item) => ({
          itemId: item.itemId || null,
          unitId: item.unitId || null,
          indentQuantity: item.qty, // or original indent quantity, but using item.qty for requested quantity is fine. Let's see if we should send indentQuantity as the original one? No, the backend defaults to item.indentQuantity || original_qty. Sending item.qty is correct.
          orderQuantity: item.qty,
          rate: item.price,
          description: item.description || ""
        })),
        bypassApproval: true,
        freightCharges: Number(freightCharges) || 0,
        packagingCharges: Number(packagingCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        gst: Number(gst) || 0
      });
      toast.success("Purchase Order created successfully");
      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
    } finally {
      setIsFormSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white text-zinc-950">
        <DialogHeader className="p-8 bg-zinc-900 text-white pb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/15 rounded-xl">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Create Purchase Order
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            Generate a new procurement request from an indent
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGeneratePO} className="p-8 space-y-6">
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">
                    Select Indent
                  </Label>
                  <Select
                    value={selectedIndentId}
                    onValueChange={handleIndentSelect}
                    required
                    disabled={!!defaultIndentId}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                      <SelectValue placeholder="Choose an Indent" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56">
                      {indents.map((ind) => (
                        <SelectItem
                          key={ind._id}
                          value={ind._id}
                          className="font-bold text-xs"
                        >
                          {ind.indentId || ind.indentNo} (
                          {ind.projectId?.projectName ||
                            ind.projectId?.name ||
                            "No Project"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">
                    Select Vendor
                  </Label>
                  <Select
                    value={selectedVendorId}
                    onValueChange={handleVendorSelect}
                    required
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                      <SelectValue placeholder="Choose a Vendor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56">
                      {vendors.map((vendor) => (
                        <SelectItem
                          key={vendor._id || vendor.id}
                          value={vendor._id || vendor.id || ""}
                          className="font-bold text-xs"
                        >
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedIndentId && activeIndent && (
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">
                    Requested Items
                  </Label>
                  <div className="rounded-2xl border border-zinc-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                          <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-[8%] text-center">
                            <input
                              type="checkbox"
                              checked={
                                items.length > 0 &&
                                items
                                  .filter((i) => !i.poCreated)
                                  .every((i) => i.selected)
                              }
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setItems((prev) =>
                                  prev.map((item) =>
                                    item.poCreated
                                      ? item
                                      : { ...item, selected: checked }
                                  )
                                );
                              }}
                              className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-[27%]">
                            Item
                          </th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-left w-[30%]">
                            Description
                          </th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center w-[15%]">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center w-[13%]">
                            Unit Price (₹)
                          </th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right w-[10%]">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={
                              item.poCreated ? "bg-zinc-50/50 opacity-70" : ""
                            }
                          >
                            <td className="px-4 py-3 text-center w-[8%]">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                disabled={item.poCreated}
                                onChange={() => toggleItemSelection(idx)}
                                className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-6 py-3 w-[27%]">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-zinc-400" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-zinc-900">
                                    {item.name}
                                  </span>
                                  <span className="text-[8px] font-bold text-zinc-400 uppercase">
                                    ID:{" "}
                                    {item.itemId
                                      ? item.itemId.slice(-6).toUpperCase()
                                      : "N/A"}
                                  </span>
                                  {item.poCreated && (
                                    <span className="text-[9px] text-amber-600 font-semibold mt-1">
                                      PO is already created for this item
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 w-[30%]">
                              <Input
                                placeholder={
                                  item.poCreated
                                    ? "PO already created"
                                    : "e.g. Specifications / Brand"
                                }
                                value={item.description || ""}
                                disabled={item.poCreated}
                                onChange={(e) =>
                                  handleDescriptionChange(idx, e.target.value)
                                }
                                className="h-8 w-full rounded-lg bg-zinc-50 border-zinc-200 font-bold text-xs px-2.5 disabled:bg-zinc-100"
                              />
                            </td>
                            <td className="px-6 py-3 text-center w-[15%]">
                              <div className="flex items-center justify-center gap-1.5">
                                <Input
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  placeholder="0"
                                  value={item.qty}
                                  disabled={item.poCreated}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) =>
                                    handleQtyChange(
                                      idx,
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                    )
                                  }
                                  className="h-8 w-20 rounded-lg bg-zinc-50 border-zinc-200 text-center font-bold text-xs disabled:bg-zinc-100"
                                />
                                <span className="text-[10px] font-bold text-zinc-500">
                                  {item.unit}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-center w-[13%]">
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={item.price}
                                  disabled={item.poCreated}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) =>
                                    handlePriceChange(
                                      idx,
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                    )
                                  }
                                  className="h-8 w-20 rounded-lg bg-zinc-50 border-zinc-200 text-center font-bold text-xs disabled:bg-zinc-100"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-zinc-900 w-[10%]">
                              ₹
                              {(
                                item.qty * (Number(item.price) || 0)
                              ).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {activeVendor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">
                          Drop Location
                        </Label>
                        <Textarea
                          value={dropLocation}
                          onChange={(e) => setDropLocation(e.target.value)}
                          placeholder="Specify delivery drop location"
                          className="min-h-[80px] rounded-xl bg-zinc-50 border-zinc-100 p-4 font-bold text-xs"
                        />
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 text-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center font-bold pb-1 border-b border-zinc-150">
                          <span className="text-zinc-500">Subtotal:</span>
                          <span className="text-zinc-900">
                            ₹{subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 my-1.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-400">
                              Freight (₹)
                            </span>
                            <Input
                              type="number"
                              min="0"
                              value={freightCharges || ""}
                              onChange={(e) =>
                                setFreightCharges(
                                  Math.max(0, Number(e.target.value))
                                )
                              }
                              className="h-7 rounded-lg bg-white border-zinc-200 text-[11px] font-bold px-2 text-right shadow-sm"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-400">
                              Packing (₹)
                            </span>
                            <Input
                              type="number"
                              min="0"
                              value={packagingCharges || ""}
                              onChange={(e) =>
                                setPackagingCharges(
                                  Math.max(0, Number(e.target.value))
                                )
                              }
                              className="h-7 rounded-lg bg-white border-zinc-200 text-[11px] font-bold px-2 text-right shadow-sm"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-400">
                              Other (₹)
                            </span>
                            <Input
                              type="number"
                              min="0"
                              value={otherCharges || ""}
                              onChange={(e) =>
                                setOtherCharges(
                                  Math.max(0, Number(e.target.value))
                                )
                              }
                              className="h-7 rounded-lg bg-white border-zinc-200 text-[11px] font-bold px-2 text-right shadow-sm"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-400">
                              GST (%)
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={gst || ""}
                              onChange={(e) =>
                                setGst(
                                  Math.min(
                                    100,
                                    Math.max(0, Number(e.target.value))
                                  )
                                )
                              }
                              className="h-7 rounded-lg bg-white border-zinc-200 text-[11px] font-bold px-2 text-right shadow-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="h-px bg-zinc-200 my-1" />
                        <div className="flex justify-between items-center text-sm pt-1">
                          <span className="font-black text-zinc-900">
                            Grand Total:
                          </span>
                          <span className="font-black text-teal-600">
                            ₹{grandTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t border-zinc-50 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl font-bold text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!activeVendor || isFormSubmitting}
              className="rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/10 gap-2"
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4" /> Generate PO
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
