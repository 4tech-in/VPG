"use client";

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  useMemo,
  useCallback
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Wallet,
  MapPin,
  MessageSquare,
  StickyNote,
  Files,
  ClipboardCheck,
  CalendarDays,
  Store,
  User,
  Phone,
  Mail,
  Building,
  UploadCloud,
  Box,
  Loader2,
  Plus,
  Calculator,
  ShieldCheck,
  Trash2,
  Building2,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { indentService } from "@/service/indents.api";
import { vendorService } from "@/service/vendorService";
import { purchaseOrderService } from "@/service/purchaseOrderService";
import { projectService } from "@/service/projectService";

const getLocalDateInputValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
};

export interface ProjectRemainingItem {
  id: string;
  indentDbId: string;
  indentId: string;
  indentDate: string;
  requestedBy: string;
  itemId: string;
  itemName: string;
  unit: string;
  requestedQty: number;
  orderedQty: number;
  remainingQty: number;
  price: number;
  isCurrentIndent: boolean;
}

export interface ProjectPOItem {
  id: string;
  poDbId: string;
  poNo: string;
  poDate: string;
  vendorName: string;
  vendorMobile?: string;
  status: string;
  itemId: string;
  itemName: string;
  unit: string;
  orderQuantity: number;
  totalQuantity: number;
  materialUsed: number;
  pending: number;
  rate: number;
  amount: number;
  indentId?: string;
}

function CreatePOContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlIndentId = searchParams.get("indentId");

  const [activeTab, setActiveTab] = useState<"remarks" | "notes" | "files">(
    "remarks"
  );
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedIndentId, setSelectedIndentId] = useState<string>("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [activeIndent, setActiveIndent] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Remaining Items state
  const [projectRemainingItems, setProjectRemainingItems] = useState<
    ProjectRemainingItem[]
  >([]);
  const [isLoadingProjectItems, setIsLoadingProjectItems] = useState(false);
  const [isRemainingItemsOpen, setIsRemainingItemsOpen] = useState(true);
  const [remainingSearchTerm, setRemainingSearchTerm] = useState("");
  const [remainingFilterTab, setRemainingFilterTab] = useState<
    "same" | "all" | "current" | "other"
  >("same");

  // PO Items for stock calculation
  const [projectPOItems, setProjectPOItems] = useState<ProjectPOItem[]>([]);

  // Form inputs state
  const [dropLocation, setDropLocation] = useState("");
  const [remark, setRemark] = useState("");
  const [notes, setNotes] = useState("");
  const [validFrom, setValidFrom] = useState(getLocalDateInputValue);
  const [validTo, setValidTo] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [poImages, setPoImages] = useState<File[]>([]);
  const [freightCharges, setFreightCharges] = useState<number>(0);
  const [packagingCharges, setPackagingCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [gst, setGst] = useState<number>(0);

  const [showPriceConfirm, setShowPriceConfirm] = useState(false);

  const calledRef = useRef(false);

  const fetchProjectRemainingItems = async (
    targetProjectId: string,
    currentIndentId?: string,
    currentIndentData?: any
  ) => {
    if (!targetProjectId || targetProjectId === "ALL") {
      setProjectRemainingItems([]);
      return;
    }
    setIsLoadingProjectItems(true);
    try {
      let projIndents: any[] = [];
      try {
        const indRes = await indentService.getIndents({
          projectId: targetProjectId,
          status: "Approved",
          limit: 300
        });
        projIndents = indRes.data || indRes || [];
      } catch (e) {
        projIndents = indents.filter(
          (i) => (i.projectId?._id || i.projectId) === targetProjectId
        );
      }

      indents.forEach((ind) => {
        const pId = ind.projectId?._id || ind.projectId;
        if (
          pId === targetProjectId &&
          !projIndents.some((pi) => String(pi._id) === String(ind._id))
        ) {
          projIndents.push(ind);
        }
      });

      // If currentIndentData was provided, ensure it's in projIndents with full items
      if (currentIndentData && currentIndentId) {
        const curIdx = projIndents.findIndex(
          (pi) => String(pi._id) === String(currentIndentId)
        );
        if (curIdx >= 0) {
          projIndents[curIdx] = {
            ...projIndents[curIdx],
            ...currentIndentData
          };
        } else {
          projIndents.push(currentIndentData);
        }
      }

      let projPOs: any[] = [];
      try {
        const poRes = await purchaseOrderService.getPurchaseOrders({
          projectId: targetProjectId,
          limit: 1000
        });
        projPOs = (poRes.data || []).filter(
          (po: any) => po.status !== "Cancelled"
        );
      } catch (poErr) {
        console.error("Failed to fetch POs for project", poErr);
      }

      if (
        currentIndentId &&
        !projPOs.some(
          (po) =>
            String(po.indentId?._id || po.indentId) === String(currentIndentId)
        )
      ) {
        try {
          const singlePoRes = await purchaseOrderService.getPurchaseOrders({
            indentId: currentIndentId,
            limit: 500
          });
          const extraPOs = (singlePoRes.data || []).filter(
            (po: any) => po.status !== "Cancelled"
          );
          extraPOs.forEach((po) => {
            if (!projPOs.some((p) => p._id === po._id)) {
              projPOs.push(po);
            }
          });
        } catch (e) {}
      }

      // Enrich projPOs with material totals (materialUsed, pending, totalCount)
      const missingTotals = projPOs
        .map((po, index) => ({ po, index }))
        .filter(({ po }) => po.materialUsed == null || po.pending == null);

      if (missingTotals.length > 0) {
        let nextIndex = 0;
        await Promise.all(
          Array.from(
            { length: Math.min(6, missingTotals.length) },
            async () => {
              while (nextIndex < missingTotals.length) {
                const { po, index } = missingTotals[nextIndex++];
                const id = po._id || po.id;
                if (!id) continue;
                try {
                  const details =
                    await purchaseOrderService.getPurchaseOrderById(id);
                  projPOs[index] = {
                    ...po,
                    ...details,
                    materialUsed: details.materialUsed ?? po.materialUsed,
                    totalCount: details.totalCount ?? po.totalCount,
                    pending: details.pending ?? po.pending
                  };
                } catch (e) {}
              }
            }
          )
        );
      }

      const calculatedItems: ProjectRemainingItem[] = [];

      for (const ind of projIndents) {
        let indItems = ind.items || [];
        if (currentIndentId && String(ind._id) === String(currentIndentId)) {
          if (
            currentIndentData?.items &&
            Array.isArray(currentIndentData.items) &&
            currentIndentData.items.length > 0
          ) {
            indItems = currentIndentData.items;
          } else if (
            activeIndent?._id === currentIndentId &&
            activeIndent?.items?.length
          ) {
            indItems = activeIndent.items;
          }
        }

        const indentPOs = projPOs.filter(
          (po) =>
            String(po.indentId?._id || po.indentId || "") === String(ind._id)
        );

        indItems.forEach((item: any) => {
          const itemIdStr = String(
            item.itemId?._id ||
              item.itemId?.id ||
              (typeof item.itemId === "string" ? item.itemId : "") ||
              item._id ||
              item.id ||
              ""
          );
          const itemName =
            item.itemId?.name ||
            item.itemId?.itemName ||
            item.itemId?.materialName ||
            item.name ||
            item.itemName ||
            item.materialName ||
            (itemIdStr
              ? `Material ${itemIdStr.slice(-6).toUpperCase()}`
              : "Material Item");
          const unit =
            item.unitId?.name ||
            item.unitId?.unitName ||
            item.unitId?.label ||
            item.unit ||
            "Pcs";
          const requestedQty = Number(
            item.quantity ?? item.indentQuantity ?? item.indentQty ?? 0
          );

          const orderedQty = indentPOs.reduce((sum: number, po: any) => {
            const matchingItems = (po.items || []).filter((pi: any) => {
              const piId = String(
                pi.itemId?._id || pi.itemId?.id || pi.itemId || pi._id || ""
              );
              if (
                piId &&
                itemIdStr &&
                (piId === itemIdStr ||
                  itemIdStr.includes(piId) ||
                  piId.includes(itemIdStr))
              )
                return true;
              const piName = (
                pi.itemId?.name ||
                pi.itemId?.itemName ||
                pi.name ||
                ""
              )
                .trim()
                .toLowerCase();
              const curName = itemName.trim().toLowerCase();
              return Boolean(
                piName &&
                curName &&
                piName === curName &&
                !piName.startsWith("material")
              );
            });
            return (
              sum +
              matchingItems.reduce(
                (pSum: number, pi: any) =>
                  pSum + (Number(pi.orderQuantity ?? pi.indentQuantity) || 0),
                0
              )
            );
          }, 0);

          const remainingQty = Math.max(0, requestedQty - orderedQty);

          calculatedItems.push({
            id: `${ind._id}-${itemIdStr || Math.random()}`,
            indentDbId: ind._id,
            indentId: ind.indentId || ind.indentNo || "Indent",
            indentDate: ind.createdAt || "",
            requestedBy: ind.requestedBy?.name || "Unknown",
            itemId: itemIdStr,
            itemName,
            unit,
            requestedQty,
            orderedQty,
            remainingQty,
            price: Number(
              item.rate ??
                item.price ??
                item.itemId?.price ??
                item.itemId?.rate ??
                0
            ),
            isCurrentIndent: Boolean(
              currentIndentId && String(ind._id) === String(currentIndentId)
            )
          });
        });
      }

      const extractedPOItems: ProjectPOItem[] = [];
      projPOs.forEach((po: any) => {
        const poDbId = String(po._id || po.id || "");
        const poNo = po.poNo || "PO";
        const poDate = po.createdAt || "";
        const vendorName = po.vendorName || "Unknown Vendor";
        const vendorMobile = po.vendorMobile || "";
        const status = po.status || "Draft";
        const indentId =
          po.indentId?.indentId ||
          po.indentId?.indentNo ||
          (typeof po.indentId === "string" ? po.indentId : "");

        (po.items || []).forEach((pi: any, idx: number) => {
          const itemIdStr = String(
            pi.itemId?._id ||
              pi.itemId?.id ||
              (typeof pi.itemId === "string" ? pi.itemId : "") ||
              pi._id ||
              idx
          );
          const itemName =
            pi.itemId?.itemName ||
            pi.itemId?.name ||
            pi.name ||
            pi.itemName ||
            (itemIdStr
              ? `Material ${itemIdStr.slice(-6).toUpperCase()}`
              : "Material Item");
          const unit =
            pi.unitId?.name || pi.unitId?.unitName || pi.unit || "Pcs";
          const orderQuantity = Number(pi.orderQuantity ?? pi.quantity ?? 0);
          const totalQuantity = Number(
            pi.totalQuantity ??
              pi.totalCount ??
              (po.items?.length === 1 && po.totalCount != null
                ? po.totalCount
                : null) ??
              (po.items?.length === 1 && po.totalQuantity != null
                ? po.totalQuantity
                : null) ??
              pi.indentQuantity ??
              orderQuantity
          );

          // Calculate Material Used: total - pending == used
          let materialUsed = 0;
          if (
            po.items?.length === 1 &&
            po.materialUsed != null &&
            Number.isFinite(Number(po.materialUsed))
          ) {
            materialUsed = Number(po.materialUsed);
          } else if (
            pi.materialUsed != null &&
            Number.isFinite(Number(pi.materialUsed))
          ) {
            materialUsed = Number(pi.materialUsed);
          } else if (
            pi.issuedToRequesterQuantity != null &&
            Number.isFinite(Number(pi.issuedToRequesterQuantity))
          ) {
            materialUsed = Number(pi.issuedToRequesterQuantity);
          } else if (
            po.items?.length === 1 &&
            po.totalCount != null &&
            po.pending != null
          ) {
            materialUsed = Math.max(
              0,
              Number(po.totalCount) - Number(po.pending)
            );
          } else if (
            po.materialUsed != null &&
            Number.isFinite(Number(po.materialUsed))
          ) {
            materialUsed = Number(po.materialUsed);
          }

          // Calculate Pending: total - used == pending
          let pending = 0;
          if (
            po.items?.length === 1 &&
            po.pending != null &&
            Number.isFinite(Number(po.pending))
          ) {
            pending = Number(po.pending);
          } else if (
            pi.pending != null &&
            Number.isFinite(Number(pi.pending))
          ) {
            pending = Number(pi.pending);
          } else {
            pending = Math.max(0, totalQuantity - materialUsed);
          }

          // Verify user formula: total - pending == used
          if (materialUsed === 0 && pending > 0 && pending < totalQuantity) {
            materialUsed = totalQuantity - pending;
          }
          if (
            pending === 0 &&
            materialUsed > 0 &&
            materialUsed < totalQuantity
          ) {
            pending = totalQuantity - materialUsed;
          }
          const rate = Number(pi.rate ?? pi.price ?? 0);
          const amount = Number(pi.amount ?? orderQuantity * rate ?? 0);

          extractedPOItems.push({
            id: `${poDbId}-${itemIdStr}-${idx}`,
            poDbId,
            poNo,
            poDate,
            vendorName,
            vendorMobile,
            status,
            itemId: itemIdStr,
            itemName,
            unit,
            orderQuantity,
            totalQuantity,
            materialUsed,
            pending,
            rate,
            amount,
            indentId: indentId || undefined
          });
        });
      });

      setProjectRemainingItems(calculatedItems);
      setProjectPOItems(extractedPOItems);
    } catch (err) {
      console.error("Error computing project remaining items", err);
    } finally {
      setIsLoadingProjectItems(false);
    }
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId || projId === "ALL") {
      setProjectRemainingItems([]);
      setProjectPOItems([]);
      return;
    }

    if (selectedIndentId && activeIndent) {
      const currentProjId =
        activeIndent.projectId?._id || activeIndent.projectId;
      if (currentProjId !== projId) {
        setSelectedIndentId("");
        setActiveIndent(null);
        setItems([]);
      }
    }
    fetchProjectRemainingItems(projId, selectedIndentId, activeIndent);
  };

  const handleIndentSelect = async (val: string) => {
    setSelectedIndentId(val);
    setSelectedVendorIds([]);
    setActiveIndent(null);
    setItems([]);

    try {
      const res = await indentService.getIndentById(val);
      let fullIndent =
        (res as any)?.data?.indent ||
        (res as any)?.indent ||
        (res as any)?.data ||
        res;
      if (!fullIndent || !Array.isArray(fullIndent.items)) {
        const found = indents.find((i: any) => String(i._id) === String(val));
        if (found) {
          fullIndent = { ...found, ...(fullIndent || {}) };
        }
      }
      setActiveIndent(fullIndent);

      const projId = fullIndent?.projectId?._id || fullIndent?.projectId || "";
      if (projId) {
        setSelectedProjectId(projId);
      }

      if (fullIndent?.storageLocation) {
        setDropLocation(fullIndent.storageLocation);
      } else if (fullIndent?.projectId?.address) {
        setDropLocation(fullIndent.projectId.address);
      } else if (fullIndent?.projectId?.location) {
        setDropLocation(fullIndent.projectId.location);
      } else {
        setDropLocation("");
      }

      // Fetch active POs for this indent to compute already ordered quantities
      let indentPOs: any[] = [];
      try {
        const poRes = await purchaseOrderService.getPurchaseOrders({
          indentId: val,
          limit: 1000
        });
        indentPOs = (poRes.data || []).filter(
          (po: any) => po.status !== "Cancelled"
        );
      } catch (err) {
        console.error("Failed to fetch existing POs for indent", err);
      }

      const indentItems = Array.isArray(fullIndent?.items)
        ? fullIndent.items
        : [];
      if (indentItems.length > 0) {
        setItems(
          indentItems.map((item: any) => {
            const itemIdStr = String(
              item.itemId?._id ||
                item.itemId?.id ||
                (typeof item.itemId === "string" ? item.itemId : "") ||
                item._id ||
                item.id ||
                ""
            );
            const itemName =
              item.itemId?.name ||
              item.itemId?.itemName ||
              item.itemId?.materialName ||
              item.name ||
              item.itemName ||
              item.materialName ||
              (itemIdStr
                ? `Material ${itemIdStr.slice(-6).toUpperCase()}`
                : "Material Item");
            const indentQty = Number(
              item.quantity ?? item.indentQuantity ?? item.indentQty ?? 0
            );

            const orderedQty = indentPOs.reduce((sum: number, po: any) => {
              const matchingItems = (po.items || []).filter((pi: any) => {
                const piId = String(
                  pi.itemId?._id || pi.itemId?.id || pi.itemId || pi._id || ""
                );
                if (
                  piId &&
                  itemIdStr &&
                  (piId === itemIdStr ||
                    itemIdStr.includes(piId) ||
                    piId.includes(itemIdStr))
                )
                  return true;
                const piName = (
                  pi.itemId?.name ||
                  pi.itemId?.itemName ||
                  pi.name ||
                  ""
                )
                  .trim()
                  .toLowerCase();
                const curName = itemName.trim().toLowerCase();
                return Boolean(
                  piName &&
                  curName &&
                  piName === curName &&
                  !piName.startsWith("material")
                );
              });
              return (
                sum +
                matchingItems.reduce(
                  (pSum: number, pi: any) =>
                    pSum + (Number(pi.orderQuantity ?? pi.indentQuantity) || 0),
                  0
                )
              );
            }, 0);

            const remainingQty = Math.max(0, indentQty - orderedQty);

            return {
              itemId: itemIdStr,
              name: itemName,
              indentQty,
              orderedQty,
              remainingQty,
              qty: remainingQty > 0 ? remainingQty : 0,
              unitId:
                item.unitId?._id ||
                item.unitId?.id ||
                (typeof item.unitId === "string" ? item.unitId : ""),
              unit:
                item.unitId?.name ||
                item.unitId?.unitName ||
                item.unitId?.label ||
                item.unit ||
                "Pcs",
              price:
                item.rate ??
                item.price ??
                item.itemId?.price ??
                item.itemId?.rate ??
                "",
              originalPrice:
                item.rate ??
                item.price ??
                item.itemId?.price ??
                item.itemId?.rate ??
                "",
              description: item.description || "",
              assignedVendorId: ""
            };
          })
        );
      }

      if (projId) {
        fetchProjectRemainingItems(projId, val, fullIndent);
      }
    } catch (err) {
      toast.error("Failed to fetch indent details");
    }
  };

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const loadInitialData = async () => {
      setIsDataLoading(true);
      try {
        const indentsRes = await indentService.getIndents({
          status: "Approved"
        });
        const loadedIndents = indentsRes.data || indentsRes || [];
        setIndents(loadedIndents);

        const vendorsRes = await vendorService.getVendors({ limit: 1000 });
        setVendors(vendorsRes.vendors || vendorsRes || []);

        try {
          const projectsRes = await projectService.getProjects({ limit: 1000 });
          const loadedProjects =
            projectsRes.projects || (projectsRes as any).data || [];
          setProjects(loadedProjects);
        } catch (e) {
          console.error("Failed to load projects", e);
        }

        if (urlIndentId) {
          const found = loadedIndents.find((i: any) => i._id === urlIndentId);
          if (found) {
            await handleIndentSelect(urlIndentId);
          } else {
            try {
              const directIndent =
                await indentService.getIndentById(urlIndentId);
              if (directIndent) {
                setIndents((prev) => {
                  if (!prev.some((i) => i._id === urlIndentId)) {
                    return [...prev, directIndent];
                  }
                  return prev;
                });
                await handleIndentSelect(urlIndentId);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err: any) {
        toast.error("Failed to load indents or vendors data");
      } finally {
        setIsDataLoading(false);
      }
    };
    loadInitialData();
  }, [urlIndentId]);

  const handleVendorToggle = (val: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleVendorAssignmentChange = (idx: number, vendorId: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, assignedVendorId: vendorId } : item
      )
    );
  };

  const handleQtyChange = (idx: number, val: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, qty: val } : item))
    );
  };

  const handlePriceChange = (idx: number, val: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
    );
  };

  const handleDescriptionChange = (idx: number, val: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
    );
  };

  const handleAddAnotherItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemId: `custom-${Date.now()}`,
        name: "New Item",
        indentQty: 1,
        orderedQty: 0,
        remainingQty: 1,
        qty: 1,
        unitId: "",
        unit: "Pcs",
        price: 0,
        originalPrice: 0,
        description: "",
        assignedVendorId: selectedVendorIds[0] || ""
      }
    ]);
  };

  const handleAddItemBack = (remItem: ProjectRemainingItem) => {
    const isAlready = items.some((i) => {
      const iId = String(i.itemId || i._id || "").trim();
      const remId = String(remItem.itemId || remItem.id || "").trim();
      if (
        iId &&
        remId &&
        (iId === remId || remId.includes(iId) || iId.includes(remId))
      ) {
        return true;
      }
      const iName = (i.name || "").trim().toLowerCase();
      const remName = (remItem.itemName || "").trim().toLowerCase();
      return Boolean(
        iName &&
        remName &&
        iName === remName &&
        !iName.startsWith("material") &&
        iName !== "unknown item"
      );
    });

    if (isAlready) {
      toast.info(`"${remItem.itemName}" is already in the order list`);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        itemId: remItem.itemId,
        name: remItem.itemName,
        indentQty: remItem.requestedQty,
        orderedQty: remItem.orderedQty,
        remainingQty: remItem.remainingQty,
        qty: remItem.remainingQty > 0 ? remItem.remainingQty : 1,
        unitId: "",
        unit: remItem.unit,
        price: remItem.price || 0,
        originalPrice: remItem.price || 0,
        description: "",
        assignedVendorId: selectedVendorIds[0] || ""
      }
    ]);
    toast.success(`Added "${remItem.itemName}" to order list`);
  };

  const handleAddAllToPO = (itemsToAdd?: ProjectRemainingItem[]) => {
    const targets =
      itemsToAdd || projectRemainingItems.filter((i) => i.remainingQty > 0);
    let addedCount = 0;
    setItems((prev) => {
      const updated = [...prev];
      targets.forEach((remItem) => {
        const exists = updated.some((i) => {
          const iId = String(i.itemId || i._id || "").trim();
          const remId = String(remItem.itemId || remItem.id || "").trim();
          if (
            iId &&
            remId &&
            (iId === remId || remId.includes(iId) || iId.includes(remId))
          ) {
            return true;
          }
          const iName = (i.name || "").trim().toLowerCase();
          const remName = (remItem.itemName || "").trim().toLowerCase();
          return Boolean(
            iName &&
            remName &&
            iName === remName &&
            !iName.startsWith("material") &&
            iName !== "unknown item"
          );
        });
        if (!exists) {
          updated.push({
            itemId: remItem.itemId,
            name: remItem.itemName,
            indentQty: remItem.requestedQty,
            orderedQty: remItem.orderedQty,
            remainingQty: remItem.remainingQty,
            qty: remItem.remainingQty > 0 ? remItem.remainingQty : 1,
            unitId: "",
            unit: remItem.unit,
            price: remItem.price || 0,
            originalPrice: remItem.price || 0,
            description: "",
            assignedVendorId: selectedVendorIds[0] || ""
          });
          addedCount++;
        }
      });
      return updated;
    });
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} item(s) to order list`);
    } else {
      toast.info("All items are already in the order list");
    }
  };

  const handleRemoveFullyOrdered = () => {
    const remainingOnly = items.filter(
      (i) => (Number(i.remainingQty) || 0) > 0
    );
    const countRemoved = items.length - remainingOnly.length;
    if (countRemoved > 0) {
      setItems(remainingOnly);
      toast.success(`Removed ${countRemoved} fully ordered item(s)`);
    } else {
      toast.info("No fully ordered items to remove");
    }
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const activeVendors = vendors.filter((v) =>
    selectedVendorIds.includes(v._id || v.id)
  );

  const isItemPoCreated = (item: any) =>
    (Number(item.remainingQty) || 0) <= 0 ||
    (Number(item.orderedQty) > 0 &&
      Number(item.orderedQty) >= Number(item.indentQty));

  const activeOrderItems = items.filter((item) => !isItemPoCreated(item));

  const subtotal = activeOrderItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
    0
  );
  const taxableAmount =
    subtotal +
    (Number(freightCharges) || 0) +
    (Number(packagingCharges) || 0) +
    (Number(otherCharges) || 0);
  const grandTotal = taxableAmount + (taxableAmount * (Number(gst) || 0)) / 100;

  const handleGeneratePO = async () => {
    if (!selectedIndentId || selectedVendorIds.length === 0) {
      toast.error("Please select an indent and at least one vendor");
      return;
    }

    if (activeOrderItems.length === 0) {
      toast.error(
        "All items from this indent have already had their PO created."
      );
      return;
    }

    const unassignedItems = activeOrderItems.filter(
      (item) => !item.assignedVendorId
    );
    if (unassignedItems.length > 0) {
      toast.error("Please assign a vendor to all requested items");
      return;
    }

    if (activeOrderItems.some((item) => (Number(item.qty) || 0) <= 0)) {
      toast.error(
        "All items being ordered must have a quantity greater than 0"
      );
      return;
    }

    const today = getLocalDateInputValue();
    if (
      [validFrom, validTo, expectedDeliveryDate].some(
        (value) => value && value < today
      )
    ) {
      toast.error("Validity and delivery dates cannot be in the past");
      return;
    }

    if (validFrom && validTo && validTo < validFrom) {
      toast.error("Valid To date cannot be earlier than Valid From date");
      return;
    }

    const hasPriceChange = activeOrderItems.some(
      (item) =>
        item.originalPrice !== undefined &&
        Number(item.price) !== Number(item.originalPrice) &&
        Number(item.price) > 0
    );

    if (hasPriceChange && !showPriceConfirm) {
      setShowPriceConfirm(true);
      return;
    }

    submitPO();
  };

  const submitPO = async () => {
    try {
      const groupedItems: Record<string, any[]> = {};
      activeOrderItems.forEach((item) => {
        if (!groupedItems[item.assignedVendorId])
          groupedItems[item.assignedVendorId] = [];
        groupedItems[item.assignedVendorId].push(item);
      });

      for (const vendorId of Object.keys(groupedItems)) {
        const vendor = vendors.find((v) => (v._id || v.id) === vendorId);
        if (!vendor) continue;

        await purchaseOrderService.createPurchaseOrder({
          indentId: selectedIndentId,
          vendorId: vendorId,
          vendorName: vendor.name,
          vendorMobile: vendor.contactNumber || "",
          vendorAddress: vendor.address || "",
          locationAddress: dropLocation.trim() || null,
          items: groupedItems[vendorId].map((item) => ({
            itemId: item.itemId.startsWith("custom-") ? null : item.itemId,
            unitId: item.unitId || null,
            indentQuantity: item.indentQty ?? item.qty,
            orderQuantity: item.qty,
            rate: item.price,
            description: item.description || ""
          })),
          validFrom: validFrom || null,
          validTo: validTo || null,
          expectedDeliveryDate: expectedDeliveryDate || null,
          remark: remark || null,
          notes: notes || null,
          images: poImages,
          freightCharges: Number(freightCharges) || 0,
          packagingCharges: Number(packagingCharges) || 0,
          otherCharges: Number(otherCharges) || 0,
          gst: Number(gst) || 0
        });
      }

      toast.success("Purchase Order(s) created successfully");
      router.push("/purchase-order");
    } catch (err) {}
  };

  const currentProjectName = useMemo(() => {
    if (activeIndent?.projectId) {
      return (
        activeIndent.projectId.projectName ||
        activeIndent.projectId.name ||
        "Project"
      );
    }
    if (selectedProjectId) {
      const found = projects.find((p) => (p._id || p.id) === selectedProjectId);
      if (found) return found.projectName || found.name;
    }
    return "Selected Project";
  }, [activeIndent, selectedProjectId, projects]);

  const filteredIndents = useMemo(() => {
    return indents;
  }, [indents]);

  const projectRemainingOnly = useMemo(() => {
    return projectRemainingItems.filter((item) => item.remainingQty > 0);
  }, [projectRemainingItems]);

  const currentIndentRemainingItems = useMemo(() => {
    return projectRemainingItems.filter(
      (item) => item.isCurrentIndent && item.remainingQty > 0
    );
  }, [projectRemainingItems]);

  const otherIndentsRemainingItems = useMemo(() => {
    return projectRemainingItems.filter(
      (item) => !item.isCurrentIndent && item.remainingQty > 0
    );
  }, [projectRemainingItems]);

  const currentItemKeys = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.itemId) set.add(String(i.itemId).trim().toLowerCase());
      if (i.name) set.add(String(i.name).trim().toLowerCase());
    });
    if (activeIndent?.items) {
      activeIndent.items.forEach((entry: any) => {
        const id = String(
          entry.itemId?._id ||
            entry.itemId?.id ||
            entry.itemId ||
            entry._id ||
            ""
        )
          .trim()
          .toLowerCase();
        if (id) set.add(id);
        const name = String(
          entry.itemId?.name || entry.itemId?.itemName || entry.name || ""
        )
          .trim()
          .toLowerCase();
        if (name) set.add(name);
      });
    }
    return set;
  }, [items, activeIndent]);

  const isSameMaterial = useCallback(
    (remItem: ProjectRemainingItem) => {
      if (currentItemKeys.size === 0) return true;
      const remId = String(remItem.itemId || "")
        .trim()
        .toLowerCase();
      const remName = String(remItem.itemName || "")
        .trim()
        .toLowerCase();
      if (remId && currentItemKeys.has(remId)) return true;
      if (
        remName &&
        currentItemKeys.has(remName) &&
        !remName.startsWith("material") &&
        remName !== "unknown item"
      )
        return true;
      return false;
    },
    [currentItemKeys]
  );

  const sameMaterialRemainingItems = useMemo(() => {
    return projectRemainingItems.filter(
      (item) => isSameMaterial(item) && item.remainingQty > 0
    );
  }, [projectRemainingItems, isSameMaterial]);

  const displayedRemainingItems = useMemo(() => {
    let list = projectRemainingItems;
    if (remainingFilterTab === "same") {
      list = list.filter((i) => isSameMaterial(i));
    } else if (remainingFilterTab === "current") {
      list = list.filter((i) => i.isCurrentIndent);
    } else if (remainingFilterTab === "other") {
      list = list.filter((i) => !i.isCurrentIndent);
    }

    if (remainingSearchTerm.trim()) {
      const term = remainingSearchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.itemName.toLowerCase().includes(term) ||
          i.indentId.toLowerCase().includes(term)
      );
    }
    return list;
  }, [
    projectRemainingItems,
    remainingFilterTab,
    remainingSearchTerm,
    isSameMaterial
  ]);

  const indentsWithRemainingCount = useMemo(() => {
    const setOfIndents = new Set(projectRemainingOnly.map((i) => i.indentDbId));
    return setOfIndents.size;
  }, [projectRemainingOnly]);

  const fullyOrderedCount = useMemo(() => {
    return items.filter((i) => (Number(i.remainingQty) || 0) <= 0).length;
  }, [items]);


  const getItemPendingStock = useCallback(
    (item: any) => {
      const currentItemId = String(
        item.itemId?._id ||
          item.itemId?.id ||
          (typeof item.itemId === "string" ? item.itemId : "") ||
          item._id ||
          item.id ||
          ""
      )
        .trim()
        .toLowerCase();
      const currentItemName = (
        item.name ||
        item.itemName ||
        item.itemId?.name ||
        item.itemId?.itemName ||
        ""
      )
        .trim()
        .toLowerCase();

      const matchingPOItems = projectPOItems.filter((poItem) => {
        const pId = String(poItem.itemId || "").trim().toLowerCase();
        if (
          currentItemId &&
          pId &&
          (pId === currentItemId ||
            currentItemId.includes(pId) ||
            pId.includes(currentItemId))
        ) {
          return true;
        }
        const pName = String(poItem.itemName || "").trim().toLowerCase();
        return Boolean(
          pName &&
            currentItemName &&
            pName === currentItemName &&
            !pName.startsWith("material") &&
            pName !== "unknown item"
        );
      });

      return matchingPOItems.reduce(
        (sum, poItem) => sum + (Number(poItem.pending) || 0),
        0
      );
    },
    [projectPOItems]
  );

  if (isDataLoading) {
    return (
      <ContentLayout title="Create Purchase Order">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 font-bold text-sm">
            Loading PO source details...
          </p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Create Purchase Order">
      <Dialog open={showPriceConfirm} onOpenChange={setShowPriceConfirm}>
        <DialogContent className="max-w-md rounded-2xl bg-white border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-zinc-900">
              Confirm Price Update
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
              You have modified the unit price of one or more items.
              <br />
              <br />
              <strong className="text-rose-600">
                Are you sure you want to update the price?
              </strong>
              <br />
              The current item price in the database will be overwritten with
              the new price.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPriceConfirm(false)}
              className="rounded-xl font-bold flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPriceConfirm(false);
                submitPO();
              }}
              className="rounded-xl font-bold flex-1 bg-primary text-white hover:bg-primary/90"
            >
              Confirm & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6 max-w-full mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full border-zinc-200 hover:bg-zinc-50 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Button>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Create Purchase Order
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr,360px] gap-6 items-start">
          {/* Left Column: Form Details */}
          <div className="space-y-6 min-w-0">
            {/* Purchase Source Block */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#EAF6F5] flex items-center justify-center text-[#0A5C53] border border-[#D1ECE8]">
                    <Box className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-zinc-900 leading-tight">
                      Purchase Source
                    </h3>
                    <p className="text-xs font-bold text-zinc-400">
                      Select indent and vendor details
                    </p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                  <FileText className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Indent
                    </Label>
                    {activeIndent?.projectId && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        Project:{" "}
                        {activeIndent.projectId?.projectName ||
                          activeIndent.projectId?.name ||
                          "N/A"}
                      </span>
                    )}
                  </div>
                  <Select
                    value={selectedIndentId}
                    onValueChange={handleIndentSelect}
                  >
                    <SelectTrigger className="h-16 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary focus:bg-white transition-all shadow-sm">
                      <SelectValue
                        placeholder={
                          filteredIndents.length === 0
                            ? "No Indents available"
                            : "Select Indent"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-1 max-h-64">
                      {filteredIndents.map((ind) => (
                        <SelectItem
                          key={ind._id}
                          value={ind._id}
                          className="rounded-xl py-3"
                        >
                          <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-black text-zinc-900 text-sm">
                              {ind.indentId || ind.indentNo} &mdash;{" "}
                              {ind.projectId?.projectName ||
                                ind.projectId?.name ||
                                "Project"}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-2">
                              <span>
                                By: {ind.requestedBy?.name || "Unknown"}
                              </span>
                              <span>&bull;</span>
                              <span>
                                {new Date(ind.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  }
                                )}
                              </span>
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Vendor
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-16 rounded-2xl border-zinc-100 font-bold focus:ring-primary transition-all shadow-sm bg-zinc-50/50 text-zinc-900 justify-between px-4"
                      >
                        <span className="truncate text-left font-black">
                          {selectedVendorIds.length > 0
                            ? `${selectedVendorIds.length} Vendor${selectedVendorIds.length > 1 ? "s" : ""} selected`
                            : "Select Vendors..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-72 p-0 rounded-2xl shadow-xl border-zinc-100"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search vendor..."
                          className="h-10"
                        />
                        <CommandList className="max-h-60">
                          <CommandEmpty>No vendor found.</CommandEmpty>
                          {vendors.map((vendor) => {
                            const vId = vendor._id || vendor.id;
                            const isSelected = selectedVendorIds.includes(vId);
                            const vendorDisplayName =
                              vendor.name ||
                              vendor.companyName ||
                              "Unnamed Vendor";
                            return (
                              <CommandItem
                                key={vId}
                                value={`${vendorDisplayName} ${vendor.companyName || ""} ${vendor.contactNumber || ""}`}
                                onSelect={() => handleVendorToggle(vId)}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-bold"
                              >
                                <div
                                  className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "border-zinc-300"
                                  )}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm">
                                    {vendorDisplayName}
                                  </span>
                                  {vendor.companyName &&
                                    vendor.companyName !== vendor.name && (
                                      <span className="text-[10px] text-zinc-400 font-normal">
                                        {vendor.companyName}
                                      </span>
                                    )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>



            <AnimatePresence>
              {selectedIndentId && activeIndent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Order Items Block */}
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-black text-zinc-900 leading-tight">
                          Requested Items
                        </h3>
                        <p className="text-xs font-bold text-zinc-400">
                          Materials to purchase in this Purchase Order
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-[#EAF6F5] text-[#0A5C53] border-none rounded-full px-4 py-1.5 font-black text-xs">
                          {items.length} {items.length === 1 ? "Item" : "Items"}
                        </Badge>
                        {fullyOrderedCount > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveFullyOrdered}
                            className="h-8 rounded-xl text-xs font-bold border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove Fully
                            Ordered ({fullyOrderedCount})
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddAnotherItem}
                          className="h-8 rounded-xl text-xs font-bold border-zinc-200 hover:bg-zinc-50 gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Custom Item
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 shadow-sm overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-3 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-[220px]">
                              Item Information
                            </th>
                            <th className="px-2 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center w-[100px]">
                              In Stock
                            </th>
                            <th className="px-2 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center w-[110px]">
                              PO Order Qty
                            </th>
                            <th className="px-2 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center w-[110px]">
                              Unit Price (₹)
                            </th>
                            <th className="px-2 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-left min-w-[160px]">
                              Assign Vendor
                            </th>
                            <th className="px-2 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right w-[110px]">
                              Total Amount
                            </th>
                            <th className="px-2 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center w-[44px]">
                              Action
                            </th>
                          </tr>
                        </thead>
                        {items.map((item, idx) => {
                          const isPoCreated = isItemPoCreated(item);
                          return (
                            <tbody
                              key={idx}
                              className="bg-white border-b border-zinc-200 last:border-b-0 group"
                            >
                              <tr
                                className={cn(
                                  "transition-colors",
                                  isPoCreated
                                    ? "bg-zinc-50/70 opacity-60"
                                    : "hover:bg-zinc-50/50"
                                )}
                              >
                                {/* 1. Item Info */}
                                <td className="px-3 py-3 align-middle w-[220px]">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200 shrink-0">
                                      <Box className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={cn(
                                            "text-sm font-semibold truncate",
                                            isPoCreated &&
                                              "line-through text-zinc-400"
                                          )}
                                        >
                                          {item.name}
                                        </span>
                                        {isPoCreated && (
                                          <Badge className="bg-zinc-200 hover:bg-zinc-200 text-zinc-600 border-none text-[8px] font-black uppercase px-1.5 py-0 rounded tracking-wider">
                                            PO Created
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
                                        ID:{" "}
                                        {String(item.itemId || "")
                                          .slice(-6)
                                          .toUpperCase() || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. In Stock: Addition of all pending quantities from previous POs */}
                                <td className="px-2 py-3 align-middle text-center w-[100px]">
                                  {(() => {
                                    const inStockQty = getItemPendingStock(item);
                                    return inStockQty > 0 ? (
                                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs inline-block">
                                        {inStockQty} {item.unit}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-400 text-xs font-semibold">
                                        0 {item.unit}
                                      </span>
                                    );
                                  })()}
                                </td>

                                {/* 5. PO Order Quantity Input */}
                                <td className="px-2 py-3 align-middle text-center w-[110px]">
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="relative flex items-center justify-center w-full min-w-[100px]">
                                      <Input
                                        type="number"
                                        min="0.001"
                                        step="any"
                                        disabled={isPoCreated}
                                        value={
                                          isPoCreated
                                            ? 0
                                            : item.qty === 0
                                              ? ""
                                              : item.qty
                                        }
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={(e) =>
                                          handleQtyChange(
                                            idx,
                                            e.target.value === ""
                                              ? 0
                                              : Number(e.target.value)
                                          )
                                        }
                                        className={cn(
                                          "h-10 w-full min-w-[100px] rounded-xl text-xs font-bold text-center pl-3 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm transition-all",
                                          isPoCreated
                                            ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through"
                                            : "bg-white border-zinc-200 focus-visible:ring-2 focus-visible:ring-[#0A5C53]/20 focus-visible:border-[#0A5C53]",
                                          !isPoCreated &&
                                            item.remainingQty > 0 &&
                                            item.qty > item.remainingQty &&
                                            "border-rose-400 focus-visible:border-rose-500"
                                        )}
                                      />
                                      <span className="absolute right-3 text-[10px] font-bold text-zinc-500 pointer-events-none">
                                        {item.unit}
                                      </span>
                                    </div>
                                    {isPoCreated ? (
                                      <span className="text-[9px] text-zinc-400 font-semibold block mt-1 leading-tight line-through">
                                        PO already created
                                      </span>
                                    ) : item.remainingQty > 0 &&
                                      item.qty > item.remainingQty ? (
                                      <span className="text-[9px] text-rose-500 font-bold block mt-1 leading-tight">
                                        Exceeds ({item.remainingQty})
                                      </span>
                                    ) : item.remainingQty === 0 ? (
                                      <span className="text-[9px] text-zinc-400 font-semibold block mt-1 leading-tight">
                                        Fully ordered
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                {/* 6. Unit Price */}
                                <td className="px-2 py-3 align-middle text-center w-[110px]">
                                  <div className="relative flex items-center justify-center w-full min-w-[90px]">
                                    <div className="absolute left-3 text-xs font-bold text-zinc-500 pointer-events-none">
                                      ₹
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="any"
                                      disabled={isPoCreated}
                                      value={
                                        isPoCreated
                                          ? item.price || 0
                                          : item.price === 0
                                            ? ""
                                            : (item.price ?? "")
                                      }
                                      placeholder="0.00"
                                      onWheel={(e) => e.currentTarget.blur()}
                                      onChange={(e) =>
                                        handlePriceChange(
                                          idx,
                                          e.target.value === ""
                                            ? 0
                                            : Number(e.target.value)
                                        )
                                      }
                                      className={cn(
                                        "h-10 w-full min-w-[90px] rounded-xl text-xs font-bold text-left pl-7 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm transition-all",
                                        isPoCreated
                                          ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through"
                                          : "bg-white border-zinc-200 focus-visible:ring-2 focus-visible:ring-[#0A5C53]/20 focus-visible:border-[#0A5C53]"
                                      )}
                                    />
                                  </div>
                                </td>

                                {/* 7. Vendor */}
                                <td className="px-2 py-3 align-middle text-left min-w-[160px]">
                                  {isPoCreated ? (
                                    <div className="h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-400 flex items-center justify-center cursor-not-allowed line-through">
                                      Already Ordered
                                    </div>
                                  ) : (
                                    <Select
                                      value={item.assignedVendorId || ""}
                                      onValueChange={(val) =>
                                        handleVendorAssignmentChange(idx, val)
                                      }
                                    >
                                      <SelectTrigger className="h-10 rounded-xl bg-white border-zinc-200 text-xs font-semibold focus:ring-2 focus:ring-[#0A5C53]/20 focus:border-[#0A5C53] transition-all shadow-sm">
                                        <SelectValue placeholder="Select Vendor" />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl shadow-lg border border-zinc-200 max-h-56">
                                        {(activeVendors.length > 0
                                          ? activeVendors
                                          : vendors
                                        ).length > 0 ? (
                                          (activeVendors.length > 0
                                            ? activeVendors
                                            : vendors
                                          ).map((vendor) => (
                                            <SelectItem
                                              key={vendor._id || vendor.id}
                                              value={vendor._id || vendor.id}
                                              className="text-xs font-semibold cursor-pointer py-2"
                                            >
                                              {vendor.name ||
                                                vendor.companyName ||
                                                "Vendor"}
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <div className="p-3 text-xs text-zinc-500 text-center font-semibold">
                                            No vendors found
                                          </div>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </td>

                                {/* 8. Total Amount */}
                                <td className="px-2 py-3 align-middle text-right w-[110px]">
                                  <span
                                    className={cn(
                                      "text-sm font-black whitespace-nowrap",
                                      isPoCreated
                                        ? "line-through text-zinc-400"
                                        : "text-zinc-900"
                                    )}
                                  >
                                    ₹
                                    {isPoCreated
                                      ? "0.00"
                                      : (
                                          item.qty * (item.price || 0)
                                        ).toLocaleString("en-IN", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}
                                  </span>
                                </td>

                                {/* 9. Action */}
                                <td className="px-2 py-3 align-middle text-center w-[44px]">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove from PO"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                              <tr className="hover:bg-zinc-50/50 transition-colors">
                                <td colSpan={7} className="px-3 pb-3 pt-1">
                                  <Input
                                    placeholder="Add details, specifications, or notes for this item..."
                                    value={item.description || ""}
                                    onChange={(e) =>
                                      handleDescriptionChange(
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="h-10 rounded-xl bg-zinc-50/50 border-zinc-200 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#0A5C53]/20 focus-visible:border-[#0A5C53] transition-all shadow-sm"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          );
                        })}
                      </table>
                    </div>
                  </div>

                  {/* Validity & Delivery Block */}
                  {activeVendors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-black text-zinc-900 leading-tight">
                            Validity & Delivery
                          </h3>
                          <p className="text-xs font-bold text-zinc-400">
                            Specify order validity and expected timeline
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Valid From
                          </Label>
                          <Input
                            type="date"
                            min={getLocalDateInputValue()}
                            value={validFrom}
                            onChange={(e) => {
                              const value = e.target.value;
                              setValidFrom(value);
                              if (validTo && validTo < value) setValidTo("");
                              if (
                                expectedDeliveryDate &&
                                expectedDeliveryDate < value
                              )
                                setExpectedDeliveryDate("");
                            }}
                            className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Valid To
                          </Label>
                          <Input
                            type="date"
                            min={validFrom || getLocalDateInputValue()}
                            value={validTo}
                            onChange={(e) => setValidTo(e.target.value)}
                            className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Est. Delivery Date
                          </Label>
                          <Input
                            type="date"
                            min={validFrom || getLocalDateInputValue()}
                            value={expectedDeliveryDate}
                            onChange={(e) =>
                              setExpectedDeliveryDate(e.target.value)
                            }
                            className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold focus:ring-primary"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Vendor Details Block */}
                  {activeVendors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-black text-zinc-900 leading-tight">
                            Selected Vendors
                          </h3>
                          <p className="text-xs font-bold text-zinc-400">
                            Verified supplier information
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                          <Store className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="flex flex-col divide-y divide-zinc-100">
                        {activeVendors.map((vendor: any) => (
                          <div
                            key={vendor._id || vendor.id}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 first:pt-2 last:pb-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                <User className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  Vendor Name
                                </span>
                                <span className="text-sm font-black text-zinc-900 mt-0.5">
                                  {vendor.name}
                                </span>
                                {vendor.contactPerson && (
                                  <span className="text-[10px] font-bold text-zinc-400">
                                    {vendor.contactPerson}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                <Building className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  Business Address
                                </span>
                                <span className="text-sm font-black text-zinc-900 mt-0.5">
                                  {vendor.address || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                <Phone className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  Contact Number
                                </span>
                                <span className="text-sm font-black text-zinc-900 mt-0.5">
                                  {vendor.contactNumber || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                <Mail className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  Email Address
                                </span>
                                <span className="text-sm font-black text-zinc-900 mt-0.5">
                                  {vendor.email || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs Section */}
            <div className="bg-white rounded-[2rem] border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="grid grid-cols-3 bg-zinc-50/50 p-1">
                {[
                  { id: "remarks", label: "REMARKS", icon: MessageSquare },
                  { id: "notes", label: "NOTES", icon: StickyNote },
                  { id: "files", label: "FILES", icon: Files }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "h-12 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all",
                      activeTab === tab.id
                        ? "bg-white text-primary shadow-sm border border-zinc-100"
                        : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    <tab.icon
                      className={cn(
                        "h-4 w-4",
                        activeTab === tab.id ? "text-primary" : "text-zinc-300"
                      )}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-6 min-h-[200px]">
                <AnimatePresence mode="wait">
                  {activeTab === "remarks" && (
                    <motion.div
                      key="remarks"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col gap-3"
                    >
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        INTERNAL ORDER REMARKS
                      </h4>
                      <Textarea
                        placeholder="Add general remarks about this purchase order..."
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        className="min-h-[100px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-5 font-bold text-sm focus:ring-primary focus:bg-white transition-all shadow-inner placeholder:text-zinc-300"
                      />
                    </motion.div>
                  )}
                  {activeTab === "notes" && (
                    <motion.div
                      key="notes"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col gap-3"
                    >
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        ORDER NOTES
                      </h4>
                      <Textarea
                        placeholder="Add notes for this purchase order..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-5 font-bold text-sm focus:ring-primary focus:bg-white transition-all shadow-inner placeholder:text-zinc-300"
                      />
                    </motion.div>
                  )}
                  {activeTab === "files" && (
                    <motion.div
                      key="files"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col gap-4"
                    >
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        PURCHASE ORDER IMAGES / ATTACHMENTS
                      </h4>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-6 hover:bg-zinc-50 transition-colors cursor-pointer relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const selectedFiles = Array.from(
                              e.target.files || []
                            );
                            setPoImages((prev) => [...prev, ...selectedFiles]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="h-12 w-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-3">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-zinc-700 text-center">
                          Click or Drop files to upload
                        </span>
                        <span className="text-[9px] text-zinc-400 font-medium text-center mt-1">
                          PDF, JPG, PNG (MAX 10MB)
                        </span>
                      </div>

                      {poImages.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Selected Files:
                          </h5>
                          {poImages.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-100"
                            >
                              <span className="text-xs font-bold text-zinc-700 truncate max-w-[200px]">
                                {file.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() =>
                                  setPoImages((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="h-7 w-7 text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Logistics */}
          <div className="space-y-6 min-w-0">
            {/* Order Summary Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                  Order Summary
                </h3>
                <p className="text-xs font-bold text-zinc-400">
                  Final payable amount
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-150">
                    <span className="font-bold text-zinc-500">Subtotal</span>
                    <span className="font-black text-zinc-900">
                      {activeIndent
                        ? `₹ ${subtotal.toLocaleString("en-IN")}`
                        : "₹ 0"}
                    </span>
                  </div>

                  {/* Freight Charges */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500">
                        Freight Charges
                      </span>
                      <span className="text-[9px] text-zinc-400 font-semibold">
                        Shipping & transport
                      </span>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={freightCharges || ""}
                        onChange={(e) =>
                          setFreightCharges(Math.max(0, Number(e.target.value)))
                        }
                        className="h-8 pl-6 pr-2 rounded-xl text-xs font-bold bg-zinc-50/50 border-zinc-150 text-right focus:bg-white transition-all shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Packaging Charges */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500">
                        Packaging Charges
                      </span>
                      <span className="text-[9px] text-zinc-400 font-semibold">
                        Handling & packing
                      </span>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">
                        ₹
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
                        className="h-8 pl-6 pr-2 rounded-xl text-xs font-bold bg-zinc-50/50 border-zinc-150 text-right focus:bg-white transition-all shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Other Charges */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500">
                        Other Charges
                      </span>
                      <span className="text-[9px] text-zinc-400 font-semibold">
                        Miscellaneous cost
                      </span>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={otherCharges || ""}
                        onChange={(e) =>
                          setOtherCharges(Math.max(0, Number(e.target.value)))
                        }
                        className="h-8 pl-6 pr-2 rounded-xl text-xs font-bold bg-zinc-50/50 border-zinc-150 text-right focus:bg-white transition-all shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* GST Rate */}
                  <div className="flex items-center justify-between gap-4 pb-1 border-b border-zinc-150">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500">
                        GST / Tax Rate
                      </span>
                      <span className="text-[9px] text-zinc-400 font-semibold">
                        Percentage rate
                      </span>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">
                        %
                      </span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={gst || ""}
                        onChange={(e) =>
                          setGst(
                            Math.min(100, Math.max(0, Number(e.target.value)))
                          )
                        }
                        className="h-8 pl-2 pr-6 rounded-xl text-xs font-bold bg-zinc-50/50 border-zinc-150 text-right focus:bg-white transition-all shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grand Total box matching screenshot exactly */}
              <div className="bg-[#EAF6F5] p-5 rounded-3xl flex items-center justify-between border border-[#D5EFEF]">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#0A5C53]/70 uppercase tracking-widest">
                    GRAND TOTAL
                  </span>
                  <span className="text-3xl font-black text-[#0A5C53] tracking-tighter mt-0.5">
                    {activeIndent
                      ? `₹ ${grandTotal.toLocaleString("en-IN")}`
                      : "₹ 0"}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#0A5C53] text-white flex items-center justify-center shadow-lg shadow-[#0A5C53]/20">
                  <Calculator className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Drop Location Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/60 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#EAF6F5] flex items-center justify-center text-[#0A5C53]">
                  <MapPin className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black text-zinc-900 tracking-tight">
                  Drop Location
                </h4>
              </div>
              <Textarea
                placeholder="Specify delivery drop location"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                className="min-h-[90px] rounded-2xl bg-zinc-50/50 border-zinc-100 p-5 font-bold text-xs focus:ring-primary transition-all shadow-inner placeholder:text-zinc-300"
              />
            </div>

            {/* Final Action */}
            <div className="space-y-3">
              <Button
                disabled={activeVendors.length === 0}
                onClick={handleGeneratePO}
                className={cn(
                  "w-full h-16 rounded-2xl font-black text-base gap-3 shadow-xl transition-all",
                  activeVendors.length > 0
                    ? "bg-[#0A5C53] hover:bg-[#084A42] text-white shadow-[#0A5C53]/20"
                    : "bg-zinc-100 text-zinc-300"
                )}
              >
                <ClipboardCheck className="h-5 w-5" /> Generate PO
              </Button>
              <p className="text-[10px] font-bold text-zinc-400 flex items-center justify-center gap-1.5 text-center mt-1">
                <ShieldCheck className="h-4 w-4 text-zinc-400" />
                Please review all details before generating
              </p>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

export default function CreatePOPage() {
  return (
    <Suspense
      fallback={
        <ContentLayout title="Create Purchase Order">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
            <p className="text-zinc-500 font-bold text-sm">
              Loading PO source details...
            </p>
          </div>
        </ContentLayout>
      }
    >
      <CreatePOContent />
    </Suspense>
  );
}
