"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMaterialPending } from "@/lib/material-totals";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Box,
  Search,
  Scale,
  Loader2,
  Truck,
  CheckCircle,
  ClipboardList,
  RefreshCw,
  Eye,
  Layers,
  Filter,
  Check,
  ChevronsUpDown,
  Printer,
  FileSpreadsheet,
  BookOpen,
  PackageCheck,
  Building,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { purchaseOrderService } from "@/service/purchaseOrderService";
import { getImageUrl } from "@/lib/image-url";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { useItems } from "@/hooks/use-items";
import { useUnits } from "@/hooks/use-units";
import { useGroups } from "@/hooks/use-groups";
import { useSubGroups } from "@/hooks/use-sub-groups";
import { assetService } from "@/service/assets.api";

export interface InwardRegisterRow {
  id: string;
  srNo: number;
  date: string;
  rawDate: Date;
  vendorName: string;
  vendorId?: string;
  receiptNo: string;
  poNo: string;
  poId?: string;
  po?: any;
  projectName: string;
  projectId?: string;
  itemDescription: string;
  qty: string;
  items: Array<{ itemId?: string; name: string; qty: number | string; unit: string }>;
  vehicleNo: string;
  actualCount: string | number;
  materialUsed?: number;
  pending?: number;
  totalCount?: number;
  status?: string;
  poStatus?: string;
  recdBy: string;
  billPhoto?: string | null;
  materialPhoto?: string | null;
  remarks?: string | null;
  verificationStatus?: string;
  receiptId?: string;
}

export default function MaterialMasterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeView, setActiveView] = useState<"ledger" | "inward">(
    tabParam === "inward" ? "inward" : "ledger"
  );

  useEffect(() => {
    if (tabParam === "inward") {
      setActiveView("inward");
    } else if (tabParam === "ledger") {
      setActiveView("ledger");
    }
  }, [tabParam]);

  const handleViewChange = (view: "ledger" | "inward") => {
    setActiveView(view);
    const url = view === "inward" ? "/material?tab=inward" : "/material";
    router.replace(url, { scroll: false });
  };

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [inwardEntries, setInwardEntries] = useState<any[]>([]);
  const [selectedInwardRow, setSelectedInwardRow] = useState<InwardRegisterRow | null>(null);
  const [inwardSearchQuery, setInwardSearchQuery] = useState("");
  const [summaryStats, setSummaryStats] = useState({
    totalOrders: 0,
    totalQuantity: 0,
    receivedQuantity: 0,
    pendingQuantity: 0,
    totalValue: 0,
  });
  const [inwardStats, setInwardStats] = useState({
    totalInwardEntries: 0,
    uniqueVendors: 0,
    activeProjects: 0,
    filteredResults: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showPOFilters, setShowPOFilters] = useState(false);
  const [poFilters, setPoFilters] = useState({
    projectId: "",
    vendorId: "",
    itemId: "",
    groupId: "",
    subGroupId: "",
    dateFrom: "",
    dateTo: "",
    vehicleNo: "",
    status: "",
    purchaseOrderType: "material"
  });

  const { projects } = useProjects();
  const { vendors } = useVendors();
  const { items } = useItems(true, 1000);
  const { units } = useUnits(true, 1000);
  const { groups } = useGroups();
  const { subGroups } = useSubGroups();
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);

  const unitsMap = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => {
      if (u.id) map.set(String(u.id), u.label || u.value);
      if (u.value) map.set(String(u.value), u.label || u.value);
    });
    return map;
  }, [units]);

  const getItemUnit = useCallback((item: any) => {
    // 1. Direct unit object populated on item
    if (item.unitId && typeof item.unitId === "object") {
      const name = item.unitId.name || item.unitId.unitName || item.unitId.label || item.unitId.value;
      if (name) return name;
    }
    // 2. Unit ID string mapped from units list
    if (item.unitId && typeof item.unitId === "string") {
      const matched = unitsMap.get(item.unitId);
      if (matched) return matched;
    }
    // 3. Nested in populated itemId
    if (item.itemId && typeof item.itemId === "object") {
      if (item.itemId.unitId) {
        if (typeof item.itemId.unitId === "object") {
          const name = item.itemId.unitId.name || item.itemId.unitId.unitName || item.itemId.unitId.label || item.itemId.unitId.value;
          if (name) return name;
        } else if (typeof item.itemId.unitId === "string") {
          const matched = unitsMap.get(item.itemId.unitId);
          if (matched) return matched;
        }
      }
      if (item.itemId.unit) return item.itemId.unit;
    }
    // 4. Matched from items hook if itemId is an id string
    const rawItemId = typeof item.itemId === "string" ? item.itemId : item.itemId?._id || item.itemId?.id;
    if (rawItemId) {
      const foundItem = items.find((it) => it.id === rawItemId);
      if (foundItem) {
        if (foundItem.unit) return foundItem.unit;
        if (foundItem.unitId && unitsMap.has(foundItem.unitId)) {
          return unitsMap.get(foundItem.unitId);
        }
      }
    }
    // 5. Direct unit property
    if (item.unit) return item.unit;

    return "Nos";
  }, [unitsMap, items]);

  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    assetService.getAssets({ limit: 1000 }).then(res => {
      setAssets(res.data || []);
    }).catch(console.error);
  }, []);

  // Receive Dialog State
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});
  const [isReceivingSubmit, setIsReceivingSubmit] = useState(false);

  // Issue Dialog State
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueQuantities, setIssueQuantities] = useState<
    Record<string, number>
  >({});
  const [isIssuingSubmit, setIsIssuingSubmit] = useState(false);

  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await purchaseOrderService.getMaterialInwardCombined({
        limit: 500,
        purchaseOrderType: poFilters.purchaseOrderType || undefined,
        projectId: poFilters.projectId || undefined,
        vendorId: poFilters.vendorId || undefined,
        itemId: poFilters.itemId || undefined,
        groupId: poFilters.groupId || undefined,
        subGroupId: poFilters.subGroupId || undefined,
        dateFrom: poFilters.dateFrom || undefined,
        dateTo: poFilters.dateTo || undefined,
        status: poFilters.status || undefined
      });
      const pos = response.orders || response.purchaseOrders || [];

      setSummaryStats({
        totalOrders: Number(response.totalOrders ?? response.summary?.totalOrders ?? pos.length),
        totalQuantity: Number(response.totalQuantity ?? response.summary?.totalQuantity ?? 0),
        receivedQuantity: Number(
          response.receivedQuantity ?? response.summary?.receivedQuantity ?? 0
        ),
        pendingQuantity: Number(
          response.pendingQuantity ?? response.summary?.pendingQuantity ?? 0
        ),
        totalValue: Number(response.totalValue ?? response.summary?.totalValue ?? 0),
      });

      if (Array.isArray(response.inwardEntries)) {
        setInwardEntries(response.inwardEntries);
      }

      setInwardStats({
        totalInwardEntries: Number(response.totalInwardEntries ?? response.summary?.totalInwardEntries ?? response.inwardEntries?.length ?? 0),
        uniqueVendors: Number(response.uniqueVendors ?? response.summary?.uniqueVendors ?? 0),
        activeProjects: Number(response.activeProjects ?? response.summary?.activeProjects ?? 0),
        filteredResults: Number(response.filteredResults ?? response.summary?.filteredResults ?? response.inwardEntries?.length ?? 0),
      });

      // Filter out POs that are Draft, PendingApproval, Rejected, or Cancelled if no status is chosen
      const activePOs = poFilters.status 
        ? pos 
        : pos.filter(
            (po: any) =>
              [
                "Approved",
                "Ordered",
                "PartiallyReceived",
                "Received",
                "Issued",
                "Completed",
                "PendingVerification"
              ].includes(po.status)
          );

      setPurchaseOrders(activePOs.map((po) => ({
        ...po,
        pending: po.pending ?? getMaterialPending(po),
      })));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load Purchase Orders");
    } finally {
      setIsLoading(false);
    }
  }, [poFilters]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Filtered POs list based on search, vehicle, and status tabs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (po.poNo || "").toLowerCase().includes(q) ||
        (po.vendorName || "").toLowerCase().includes(q) ||
        (po.latestSlipNo || "").toLowerCase().includes(q) ||
        (po.vehicleNo || "").toLowerCase().includes(q) ||
        (po.latestVehicleNo || "").toLowerCase().includes(q) ||
        (po.projectId?.projectName || po.projectId?.name || "")
          .toLowerCase()
          .includes(q);

      const matchesVehicle =
        !poFilters.vehicleNo ||
        (po.vehicleNo || "").toLowerCase().includes(poFilters.vehicleNo.toLowerCase()) ||
        (po.latestVehicleNo || "").toLowerCase().includes(poFilters.vehicleNo.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "PendingOrder" && po.status === "Approved") ||
        (statusFilter === "InTransit" && po.status === "Ordered") ||
        (statusFilter === "PartiallyReceived" &&
          po.status === "PartiallyReceived") ||
        (statusFilter === "Received" && po.status === "Received") ||
        (statusFilter === "Issued" && po.status === "Issued");

      return matchesSearch && matchesVehicle && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter, poFilters.vehicleNo]);

  const materialSummary = useMemo(() => {
    const sumTotal = (field: "materialUsed" | "pending" | "totalCount") => {
      if (filteredPOs.some((po) => po[field] == null || !Number.isFinite(Number(po[field])))) {
        return "—";
      }
      return filteredPOs.reduce((total, po) => total + Number(po[field]), 0)
        .toLocaleString("en-IN", { maximumFractionDigits: 2 });
    };
    return {
      used: sumTotal("materialUsed"),
      pending: sumTotal("pending"),
      total: sumTotal("totalCount"),
    };
  }, [filteredPOs]);

  const inwardRegisterRows: InwardRegisterRow[] = useMemo(() => {
    if (inwardEntries.length > 0) {
      return inwardEntries.map((r, idx) => {
        const matchedPO = purchaseOrders.find((p) => String(p._id || p.id) === String(r.poId));
        return {
          ...r,
          poId: r.poId || String(matchedPO?._id || matchedPO?.id || ""),
          po: matchedPO || r.po,
          projectId: r.projectId || String(matchedPO?.projectId?._id || matchedPO?.projectId || ""),
          vendorId: r.vendorId || String(matchedPO?.vendorId?._id || matchedPO?.vendorId || ""),
          rawDate: new Date(r.rawDate || r.timestamp || Date.now()),
          srNo: idx + 1,
        };
      });
    }
    return [];
  }, [inwardEntries, purchaseOrders]);

  const filteredInwardRows = useMemo(() => {
    let rows = inwardRegisterRows;

    if (poFilters.projectId) {
      rows = rows.filter((r) => String(r.projectId || "") === String(poFilters.projectId));
    }
    if (poFilters.vendorId) {
      rows = rows.filter((r) => String(r.vendorId || "") === String(poFilters.vendorId));
    }
    if (poFilters.dateFrom) {
      const from = new Date(poFilters.dateFrom).getTime();
      rows = rows.filter((r) => r.rawDate.getTime() >= from);
    }
    if (poFilters.dateTo) {
      const to = new Date(poFilters.dateTo);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => r.rawDate.getTime() <= to.getTime());
    }
    if (poFilters.vehicleNo) {
      const v = poFilters.vehicleNo.toLowerCase();
      rows = rows.filter((r) => (r.vehicleNo || "").toLowerCase().includes(v));
    }

    const q = (activeView === "inward" ? (inwardSearchQuery || searchQuery) : searchQuery).toLowerCase().trim();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.vendorName || "").toLowerCase().includes(q) ||
          (r.projectName || "").toLowerCase().includes(q) ||
          (r.receiptNo || "").toLowerCase().includes(q) ||
          (r.poNo || "").toLowerCase().includes(q) ||
          (r.itemDescription || "").toLowerCase().includes(q) ||
          (r.vehicleNo || "").toLowerCase().includes(q) ||
          (r.recdBy || "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [inwardRegisterRows, inwardSearchQuery, searchQuery, activeView, poFilters]);

  const handlePrintInward = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      toast.error("Please allow popups to print the inward register.");
      return;
    }

    const tableRowsHtml = filteredInwardRows
      .map((row) => {
        const itemNamesHtml =
          row.items && row.items.length > 0
            ? row.items
                .map(
                  (i) =>
                    `<div style="margin-bottom: 2px; font-weight: 600;">${i.name}</div>`
                )
                .join("")
            : row.itemDescription || "—";

        const qtyHtml =
          row.items && row.items.length > 0
            ? row.items
                .map(
                  (i) =>
                    `<div style="margin-bottom: 2px; font-weight: bold;">${i.qty} ${i.unit}</div>`
                )
                .join("")
            : row.qty;

        return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${row.srNo}</td>
        <td style="text-align: center; white-space: nowrap;">${row.date}</td>
        <td style="font-weight: 600;">${row.vendorName}</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold;">${row.receiptNo}</td>
        <td>${row.projectName}</td>
        <td>${itemNamesHtml}</td>
        <td>${qtyHtml}</td>
        <td style="text-align: center;">${row.vehicleNo}</td>
        <td style="text-align: center; font-weight: bold;">${row.actualCount}</td>
        <td>${row.recdBy}</td>
      </tr>
    `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ledger Inward Register - VPG Construction</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, -apple-system, sans-serif;
              color: #111827;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-box {
              text-align: center;
              margin-bottom: 16px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .company-name {
              font-size: 18px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .register-title {
              font-size: 14px;
              font-weight: 800;
              text-decoration: underline;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #111;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              font-weight: bold;
              margin-top: 6px;
              color: #4b5563;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f3f4f6;
              color: #000;
              border: 1px solid #000;
              padding: 6px 6px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              text-align: center;
            }
            td {
              border: 1px solid #000;
              padding: 5px 6px;
              font-size: 10px;
              vertical-align: middle;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .no-records {
              text-align: center;
              padding: 24px;
              font-weight: bold;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="company-name">VPG Construction Private Limited</div>
            <div class="register-title">Ledger Inward Register</div>
            <div class="meta-bar">
              <span>Date Generated: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</span>
              <span>Total Inward Records: ${filteredInwardRows.length}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 45px;">Sr. No</th>
                <th style="width: 80px;">Date</th>
                <th>Vendor Name</th>
                <th style="width: 110px;">Receipt No. / Slip No.</th>
                <th>Project Name</th>
                <th>Item Name</th>
                <th style="width: 100px;">Qty.</th>
                <th style="width: 90px;">Vehicle No</th>
                <th style="width: 75px;">Actual Count</th>
                <th style="width: 110px;">Recd By</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml || '<tr><td colspan="10" class="no-records">No inward entries found</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportInwardCSV = () => {
    if (filteredInwardRows.length === 0) {
      toast.error("No inward records to export");
      return;
    }

    const headers = [
      "Sr. No",
      "Date",
      "Vendor Name",
      "Receipt No / Slip No",
      "PO No",
      "Project Name",
      "Item Description",
      "Quantities",
      "Vehicle No",
      "Actual Count",
      "Received By",
    ];

    const rowsData = filteredInwardRows.map((r) => {
      const itemNames =
        r.items && r.items.length > 0
          ? r.items.map((i) => i.name).join("; ")
          : r.itemDescription;
      const qtys =
        r.items && r.items.length > 0
          ? r.items.map((i) => `${i.qty} ${i.unit}`).join("; ")
          : r.qty;

      return [
        r.srNo,
        `"${r.date}"`,
        `"${r.vendorName.replace(/"/g, '""')}"`,
        `"${r.receiptNo.replace(/"/g, '""')}"`,
        `"${r.poNo.replace(/"/g, '""')}"`,
        `"${r.projectName.replace(/"/g, '""')}"`,
        `"${itemNames.replace(/"/g, '""')}"`,
        `"${qtys.replace(/"/g, '""')}"`,
        `"${r.vehicleNo.replace(/"/g, '""')}"`,
        `"${String(r.actualCount).replace(/"/g, '""')}"`,
        `"${r.recdBy.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rowsData.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Ledger_Inward_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inward register downloaded as CSV");
  };

  // Count helper for Approved POs
  const approvedPOCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "Approved").length;
  }, [purchaseOrders]);

  // Mark PO as Ordered
  const handleMarkOrdered = async (id: string) => {
    setIsProcessingAction(id);
    try {
      await purchaseOrderService.markPurchaseOrderOrdered(id);
      toast.success("Purchase Order marked as Ordered successfully");
      await fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to order materials");
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Bulk Approve / Order All Approved POs
  const handleOrderAllApproved = async () => {
    const approvedPOs = purchaseOrders.filter((po) => po.status === "Approved");
    if (approvedPOs.length === 0) return;

    setIsProcessingAction("bulk-order");
    let successCount = 0;
    let failCount = 0;

    try {
      for (const po of approvedPOs) {
        const poId = po._id || po.id;
        if (poId) {
          try {
            await purchaseOrderService.markPurchaseOrderOrdered(poId);
            successCount++;
          } catch (e) {
            failCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully marked ${successCount} PO(s) as Ordered`);
      }
      if (failCount > 0) {
        toast.error(`Failed to process ${failCount} PO(s)`);
      }
      await fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.message || "Bulk processing failed");
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Open Receive Material Dialog
  const handleOpenReceive = (po: any) => {
    setSelectedPO(po);

    // Pre-populate receive quantities with remaining quantities to receive
    const initialQuantities: Record<string, number> = {};
    if (po.items && Array.isArray(po.items)) {
      po.items.forEach((item: any) => {
        const itemId = item.itemId?._id || item.itemId;
        const remaining =
          (item.orderQuantity || 0) - (item.receivedQuantity || 0);
        initialQuantities[itemId] = Math.max(0, remaining);
      });
    }
    setReceiveQuantities(initialQuantities);
    setIsReceiveOpen(true);
  };

  // Submit Receive Quantities
  const handleReceiveSubmit = async () => {
    if (!selectedPO) return;

    const itemsPayload = Object.entries(receiveQuantities)
      .map(([itemId, qty]) => ({
        itemId,
        receivedQuantity: Number(qty) || 0
      }))
      .filter((item) => item.receivedQuantity > 0);

    if (itemsPayload.length === 0) {
      toast.error(
        "Please enter a received quantity greater than 0 for at least one item."
      );
      return;
    }

    setIsReceivingSubmit(true);
    try {
      const poId = selectedPO._id || selectedPO.id;
      await purchaseOrderService.receivePurchaseOrderMaterial(poId, {
        items: itemsPayload
      });
      toast.success("Material receipt recorded successfully");
      setIsReceiveOpen(false);
      setSelectedPO(null);
      await fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to record material receipt");
    } finally {
      setIsReceivingSubmit(false);
    }
  };

  // Open Issue Material Dialog
  const handleOpenIssue = (po: any) => {
    setSelectedPO(po);

    // Pre-populate issue quantities with remaining received quantities to supply
    const initialQuantities: Record<string, number> = {};
    if (po.items && Array.isArray(po.items)) {
      po.items.forEach((item: any) => {
        const itemId = item.itemId?._id || item.itemId;
        const remainingToIssue =
          (item.receivedQuantity || 0) - (item.issuedToRequesterQuantity || 0);
        initialQuantities[itemId] = Math.max(0, remainingToIssue);
      });
    }
    setIssueQuantities(initialQuantities);
    setIsIssueOpen(true);
  };

  // Submit Issue Quantities
  const handleIssueSubmit = async () => {
    if (!selectedPO) return;

    const itemsPayload = Object.entries(issueQuantities)
      .map(([itemId, qty]) => ({
        itemId,
        supplyQuantity: Number(qty) || 0
      }))
      .filter((item) => item.supplyQuantity > 0);

    if (itemsPayload.length === 0) {
      toast.error(
        "Please enter a supply quantity greater than 0 for at least one item."
      );
      return;
    }

    setIsIssuingSubmit(true);
    try {
      const poId = selectedPO._id || selectedPO.id;
      await purchaseOrderService.issueMaterialToRequester(poId, {
        items: itemsPayload
      });
      toast.success("Materials issued to requester successfully");
      setIsIssueOpen(false);
      setSelectedPO(null);
      await fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue materials");
    } finally {
      setIsIssuingSubmit(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "projectId",
      header: "Project",
      cell: ({ row }) => (
        <div className="font-bold text-zinc-800">
          {row.original.projectId?.projectName ||
            row.original.projectId?.name ||
            "N/A"}
        </div>
      )
    },
    {
      accessorKey: "vendorName",
      header: "Vendor Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900">
            {row.original.vendorName}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono font-medium">
            PO: {row.original.poNo || "—"}
          </span>
        </div>
      )
    },
    {
      id: "receiptNo",
      header: "Receipt No. / Slip No.",
      cell: ({ row }) => {
        const slipNo =
          row.original.latestSlipNo ||
          row.original.receipts?.[row.original.receipts.length - 1]?.slipNo ||
          null;
        if (!slipNo) {
          return (
            <span className="text-zinc-400 text-xs font-mono font-medium">—</span>
          );
        }
        return (
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs bg-teal-50 text-teal-800 border-teal-200"
          >
            {slipNo}
          </Badge>
        );
      }
    },
    {
      id: "vehicleNo",
      header: "Vehicle No",
      cell: ({ row }) => {
        const vNo =
          row.original.latestVehicleNo ||
          row.original.vehicleNo ||
          row.original.vehicleNumber ||
          row.original.receipts?.[row.original.receipts.length - 1]?.vehicleNo ||
          "—";
        return (
          <span className="font-mono font-semibold text-zinc-700 text-xs whitespace-nowrap">
            {vNo}
          </span>
        );
      }
    },
    {
      id: "materials",
      header: "Procured Items",
      cell: ({ row }) => {
        const items = row.original.items || [];
        return (
          <div className="flex flex-col gap-1 max-w-[200px]">
            {items.slice(0, 3).map((item: any, i: number) => {
              const name =
                item.itemId?.itemName || item.itemId?.name || "Material";
              return (
                <div
                  key={i}
                  className="text-[11px] font-bold text-zinc-500 truncate border-b border-zinc-100/50 pb-0.5 last:border-none"
                >
                  {name}
                </div>
              );
            })}
            {items.length > 3 && (
              <span className="text-[9px] font-bold text-teal-600 uppercase mt-0.5">
                + {items.length - 3} more item(s)
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const items = row.original.items || [];
        return (
          <div className="flex flex-col gap-1 max-w-[150px]">
            {items.slice(0, 3).map((item: any, i: number) => {
              const unit = getItemUnit(item);
              return (
                <div
                  key={i}
                  className="text-[11px] font-extrabold text-zinc-800 truncate border-b border-zinc-100/50 pb-0.5 last:border-none"
                >
                  {item.receivedQuantity || 0}/{item.orderQuantity} {unit}
                </div>
              );
            })}
            {items.length > 3 && (
              <span className="text-[9px] text-transparent mt-0.5">
                ...
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "materialUsed",
      header: "Material Used",
      cell: ({ row }) => (
        <span className="font-bold text-zinc-800">
          {row.original.materialUsed ?? "—"}
        </span>
      )
    },
    {
      accessorKey: "pending",
      header: "Pending",
      cell: ({ row }) => (
        <span className="font-bold text-amber-600">
          {row.original.pending ?? "—"}
        </span>
      )
    },
    {
      accessorKey: "totalCount",
      header: "Total Count",
      cell: ({ row }) => (
        <span className="font-bold text-zinc-800">
          {row.original.totalCount ?? "—"}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Lifecycle Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            className={cn(
              "px-3 py-1 rounded-full font-black text-[9px] gap-1.5 border-none shadow-sm uppercase tracking-wider",
              status === "Approved"
                ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                : status === "Ordered"
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                  : status === "PartiallyReceived"
                    ? "bg-teal-50 text-teal-700 hover:bg-teal-50"
                    : status === "Received"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : status === "Issued"
                        ? "bg-purple-50 text-purple-700 hover:bg-purple-50"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current shrink-0" />
            {status === "Approved"
              ? "Approved (Pending Order)"
              : status === "Ordered"
                ? "Ordered (In-Transit)"
                : status === "PartiallyReceived"
                  ? "Partially Received"
                  : status === "Received"
                    ? "Received (At Store)"
                    : status === "Issued"
                      ? "Issued (Completed)"
                      : status}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Action Hub</div>,
      cell: ({ row }) => {
        const po = row.original;
        const id = po._id || po.id;
        const isProcessing = isProcessingAction === id;

        return (
          <div className="flex items-center justify-end gap-2 pr-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/material/${id}`)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-800 border-zinc-200 hover:bg-zinc-50 rounded-xl"
              title="View Material Ledger Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  const inwardColumns: ColumnDef<InwardRegisterRow>[] = [
    {
      accessorKey: "srNo",
      header: () => <div className="text-center font-black">Sr. No</div>,
      cell: ({ row }) => (
        <div className="text-center font-bold text-zinc-900 tabular-nums">
          {row.original.srNo}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="font-semibold text-zinc-700 whitespace-nowrap">
          {row.original.date}
        </span>
      ),
    },
    {
      accessorKey: "vendorName",
      header: "Vendor Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900">
            {row.original.vendorName}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium font-mono">
            PO: {row.original.poNo}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "receiptNo",
      header: "Receipt No. / Slip No.",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedInwardRow(row.original)}
          className="text-left group cursor-pointer"
          title="Click to view slip details"
        >
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs bg-teal-50 text-teal-800 border-teal-200 group-hover:bg-teal-100 group-hover:border-teal-300 transition-colors"
          >
            {row.original.receiptNo}
          </Badge>
        </button>
      ),
    },
    {
      accessorKey: "projectName",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="font-semibold text-zinc-800 max-w-[220px] truncate" title={row.original.projectName}>
          {row.original.projectName}
        </div>
      ),
    },
    {
      accessorKey: "itemDescription",
      header: "Item Name",
      cell: ({ row }) => {
        const items = row.original.items || [];
        if (items.length > 0) {
          return (
            <div className="flex flex-col gap-1 max-w-[220px]">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="font-bold text-zinc-900 text-xs truncate border-b border-zinc-100 pb-0.5 last:border-none last:pb-0"
                  title={item.name}
                >
                  {item.name}
                </div>
              ))}
            </div>
          );
        }
        return (
          <span className="font-bold text-zinc-900 text-xs truncate max-w-[200px]" title={row.original.itemDescription}>
            {row.original.itemDescription}
          </span>
        );
      },
    },
    {
      accessorKey: "qty",
      header: "Qty.",
      cell: ({ row }) => {
        const items = row.original.items || [];
        if (items.length > 0) {
          return (
            <div className="flex flex-col gap-1 max-w-[150px]">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="font-extrabold text-zinc-900 text-xs tracking-tight border-b border-zinc-100 pb-0.5 last:border-none last:pb-0"
                >
                  {item.qty} {item.unit}
                </div>
              ))}
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-0.5 max-w-[150px]">
            <span className="font-bold text-zinc-900 text-xs">
              {row.original.qty}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "vehicleNo",
      header: "Vehicle No",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-zinc-700 text-xs whitespace-nowrap">
          {row.original.vehicleNo}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s =
          row.original.verificationStatus ||
          row.original.status ||
          row.original.poStatus ||
          "Approved";
        const isApproved = s.toLowerCase() === "approved";
        const isPending = s.toLowerCase() === "pending";
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-black text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5",
              isApproved
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isPending
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
            )}
          >
            {s}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right font-black">Details</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-2 pr-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInwardRow(item)}
              className="h-8 px-3 rounded-xl gap-1.5 font-bold text-xs border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 shadow-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Show Details
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <ContentLayout title="Material Master">
      <div className="flex flex-col gap-8 p-6 sm:p-12 max-w-[1600px] mx-auto min-h-screen">
        {/* Top View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/70 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewChange("ledger")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-200",
                activeView === "ledger"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-white/60"
              )}
            >
              <Box className="h-4 w-4 text-rose-500" />
              Material Master (POs)
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("inward")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-200",
                activeView === "inward"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-white/60"
              )}
            >
              <BookOpen className="h-4 w-4 text-teal-600" />
              Goods Inward Register
              <Badge
                variant="outline"
                className="ml-1 text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border-teal-200"
              >
                {inwardRegisterRows.length}
              </Badge>
            </button>
          </div>

          {activeView === "inward" && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePrintInward}
                className="h-10 rounded-xl px-4 gap-2 font-bold text-xs bg-zinc-900 hover:bg-black text-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Register
              </Button>
              <Button
                onClick={handleExportInwardCSV}
                variant="outline"
                className="h-10 rounded-xl px-4 gap-2 font-bold text-xs border-zinc-200 hover:bg-zinc-50 shadow-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* Header Control Hub */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">
              {activeView === "inward" ? "Ledger Inward Register" : "Material Receipts & Goods Inward"}
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                {activeView === "inward"
                  ? "Official Goods Inward & Shipment Receiving Register"
                  : "Goods Inward & Material Lifecycle Management"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64 shrink-0">
              <Input
                placeholder={activeView === "inward" ? "Search vendor, project, slip, vehicle..." : "Search POs, vendors, vehicle..."}
                value={activeView === "inward" ? (inwardSearchQuery || searchQuery) : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setInwardSearchQuery(e.target.value);
                }}
                className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold text-sm shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>

            {activeView === "ledger" && approvedPOCount > 0 && (
              <Button
                onClick={handleOrderAllApproved}
                disabled={isProcessingAction === "bulk-order"}
                className="h-11 rounded-xl px-5 font-black shadow-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition-all active:scale-95 duration-300"
              >
                {isProcessingAction === "bulk-order" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Order All Approved ({approvedPOCount})
              </Button>
            )}

            <Button
              variant={showPOFilters ? "default" : "outline"}
              onClick={() => setShowPOFilters(!showPOFilters)}
              className={cn(
                "h-11 rounded-xl px-4 gap-2 font-bold text-sm shadow-sm transition-all",
                showPOFilters ? "text-white" : "border-zinc-200 text-zinc-600 hover:text-zinc-900"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters {Object.values(poFilters).filter(Boolean).length > 0 && `(${Object.values(poFilters).filter(Boolean).length})`}
            </Button>
            <Button
              variant="outline"
              onClick={fetchPurchaseOrders}
              className="h-11 w-11 rounded-xl p-0 border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              title="Refresh records"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PO Filters Panel */}
        {showPOFilters && (
          <div className="bg-white rounded-[2rem] border border-zinc-200/60 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 -mt-4">
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Type</Label>
              <select 
                value={poFilters.purchaseOrderType}
                onChange={e => setPoFilters(prev => ({ ...prev, purchaseOrderType: e.target.value }))}
                className="h-11 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm px-3 focus:ring-primary shadow-sm"
              >
                <option value="material">Material</option>
                <option value="assets">Asset</option>
                <option value="">All</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</Label>
              <select 
                value={poFilters.status}
                onChange={e => setPoFilters(prev => ({ ...prev, status: e.target.value }))}
                className="h-11 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm px-3 focus:ring-primary shadow-sm"
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Ordered">Ordered</option>
                <option value="PartiallyReceived">Partially Received</option>
                <option value="Received">Received</option>
                <option value="Issued">Issued (Completed)</option>
                <option value="PendingVerification">Pending Verification</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Project</Label>
              <select 
                value={poFilters.projectId}
                onChange={e => setPoFilters(prev => ({ ...prev, projectId: e.target.value }))}
                className="h-11 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm px-3 focus:ring-primary shadow-sm"
              >
                <option value="">All Projects</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendor</Label>
              <select 
                value={poFilters.vendorId}
                onChange={e => setPoFilters(prev => ({ ...prev, vendorId: e.target.value }))}
                className="h-11 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm px-3 focus:ring-primary shadow-sm"
              >
                <option value="">All Vendors</option>
                {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Group</Label>
              <select 
                value={poFilters.groupId}
                onChange={e => setPoFilters(prev => ({ ...prev, groupId: e.target.value, subGroupId: "", itemId: "" }))}
                className="h-11 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm px-3 focus:ring-primary shadow-sm"
                disabled={poFilters.purchaseOrderType === "assets"}
              >
                <option value="">All Groups</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sub Group</Label>
              <select 
                value={poFilters.subGroupId}
                onChange={e => setPoFilters(prev => ({ ...prev, subGroupId: e.target.value, itemId: "" }))}
                className="h-11 w-full rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm px-3 focus:ring-primary shadow-sm"
                disabled={poFilters.purchaseOrderType === "assets"}
              >
                <option value="">All Sub Groups</option>
                {subGroups.filter((s: any) => !poFilters.groupId || s.groupId === poFilters.groupId).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.subGroup}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {poFilters.purchaseOrderType === "assets" ? "Asset" : "Item"}
              </Label>
              <Popover open={isItemDropdownOpen} onOpenChange={setIsItemDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isItemDropdownOpen}
                    className="w-full h-11 rounded-xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary focus-visible:bg-white font-bold text-sm px-3 justify-between shadow-sm hover:bg-zinc-50"
                  >
                    {poFilters.itemId
                      ? poFilters.purchaseOrderType === "assets"
                        ? assets.find((a: any) => a._id === poFilters.itemId)?.name || "Select Asset..."
                        : items.find((i: any) => i.id === poFilters.itemId)?.name || "Select Item..."
                      : (poFilters.purchaseOrderType === "assets" ? "All Assets" : "All Items")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-zinc-100 shadow-xl bg-white" align="start">
                  <Command>
                    <CommandInput placeholder={poFilters.purchaseOrderType === "assets" ? "Search assets..." : "Search items..."} className="h-10" />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setPoFilters(prev => ({ ...prev, itemId: "" }))
                            setIsItemDropdownOpen(false)
                          }}
                          className="font-bold text-xs text-zinc-700 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              poFilters.itemId === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {poFilters.purchaseOrderType === "assets" ? "All Assets" : "All Items"}
                        </CommandItem>
                        {poFilters.purchaseOrderType === "assets"
                          ? assets.map((a: any) => (
                              <CommandItem
                                key={a._id}
                                value={a.name}
                                onSelect={() => {
                                  setPoFilters(prev => ({ ...prev, itemId: a._id }))
                                  setIsItemDropdownOpen(false)
                                }}
                                className="font-bold text-xs text-zinc-700 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    poFilters.itemId === a._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {a.name}
                              </CommandItem>
                            ))
                          : items
                              .filter(
                                (i: any) =>
                                  (!poFilters.groupId || i.groupId === poFilters.groupId) &&
                                  (!poFilters.subGroupId || i.subGroupId === poFilters.subGroupId)
                              )
                              .map((i: any) => (
                                <CommandItem
                                  key={i.id}
                                  value={i.name}
                                  onSelect={() => {
                                    setPoFilters(prev => ({ ...prev, itemId: i.id }))
                                    setIsItemDropdownOpen(false)
                                  }}
                                  className="font-bold text-xs text-zinc-700 cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      poFilters.itemId === i.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {i.name}
                                </CommandItem>
                              ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date From</Label>
              <Input 
                type="date"
                value={poFilters.dateFrom}
                onChange={e => setPoFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date To</Label>
              <Input 
                type="date"
                value={poFilters.dateTo}
                onChange={e => setPoFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vehicle No</Label>
              <Input 
                placeholder="Search vehicle no..."
                value={poFilters.vehicleNo}
                onChange={e => setPoFilters(prev => ({ ...prev, vehicleNo: e.target.value }))}
                className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm"
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setPoFilters({ projectId: "", vendorId: "", itemId: "", groupId: "", subGroupId: "", dateFrom: "", dateTo: "", vehicleNo: "", status: "", purchaseOrderType: "material" })}
                className="h-11 w-full rounded-xl font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Conditional Views */}
        {activeView === "inward" ? (
          <>
            {/* Inward Register KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Total Inward Entries
                  </p>
                  <p className="text-2xl font-black text-zinc-900 mt-1">
                    {inwardRegisterRows.length}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <PackageCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Unique Vendors
                  </p>
                  <p className="text-2xl font-black text-zinc-900 mt-1">
                    {new Set(inwardRegisterRows.map((r) => r.vendorName)).size}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Building className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Active Projects
                  </p>
                  <p className="text-2xl font-black text-zinc-900 mt-1">
                    {new Set(inwardRegisterRows.map((r) => r.projectName)).size}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Building className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Filtered Results
                  </p>
                  <p className="text-2xl font-black text-teal-700 mt-1">
                    {filteredInwardRows.length}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Filter className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Goods Inward Log Table Card */}
            <div className="bg-white rounded-[2rem] border border-zinc-200/70 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 text-teal-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                      Goods Inward Log
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      Showing all inward delivery slips and recorded deliveries
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-semibold text-xs py-1 px-3">
                  {filteredInwardRows.length} Records
                </Badge>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
                  <p className="text-zinc-500 font-bold text-sm">
                    Loading inward register records...
                  </p>
                </div>
              ) : (
                <DataTable columns={inwardColumns} data={filteredInwardRows} />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Tab-like Filters */}
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-px overflow-x-auto">
              {[
                { id: "All", label: "All POs" },
                { id: "PendingOrder", label: "Pending Order (Approved)" },
                { id: "Issued", label: "Issued (Completed)" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "h-10 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                    statusFilter === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Orders</p>
                <p className="text-2xl font-black text-zinc-800">{summaryStats.totalOrders}</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Quantity</p>
                <p className="text-2xl font-black text-indigo-600">{summaryStats.totalQuantity}</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Received Quantity</p>
                <p className="text-2xl font-black text-emerald-600">{summaryStats.receivedQuantity}</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pending Quantity</p>
                <p className="text-2xl font-black text-amber-600">{summaryStats.pendingQuantity}</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Material</p>
                <p className="text-2xl font-black text-indigo-600">{isLoading ? "—" : materialSummary.total}</p>
                <p className="text-[10px] text-zinc-400">Listed orders</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Material Used</p>
                <p className="text-2xl font-black text-teal-600">{isLoading ? "—" : materialSummary.used}</p>
                <p className="text-[10px] text-zinc-400">Listed orders</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Material Pending</p>
                <p className="text-2xl font-black text-amber-600">{isLoading ? "—" : materialSummary.pending}</p>
                <p className="text-[10px] text-zinc-400">Listed orders</p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Value</p>
                <p className="text-2xl font-black text-emerald-600">
                  ₹{summaryStats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Table Board */}
            <div className="bg-white rounded-[2rem] border border-zinc-200/60 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 text-teal-600">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                      Ledger Inward Registry
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      Material lifecycle & inward tracking overview
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleViewChange("inward")}
                  className="h-9 rounded-xl px-4 gap-2 text-xs font-bold border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  View Goods Inward Register
                </Button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
                  <p className="text-zinc-500 font-bold text-sm">
                    Loading procurement ledger...
                  </p>
                </div>
              ) : (
                <DataTable columns={columns} data={filteredPOs} />
              )}
            </div>
          </>
        )}

        {/* Dialog: Receive Material */}
        <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
          <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Box className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-150 shrink-0">
                  <Box className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
                    Receive Material Goods
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Record Goods Inward Registry
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedPO && (
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/20">
                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                        Purchase Order ID
                      </span>
                      <span className="text-sm font-black text-zinc-900 mt-1">
                        {selectedPO.poNo}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                        Vendor Name
                      </span>
                      <span className="text-sm font-black text-zinc-900 mt-1 truncate">
                        {selectedPO.vendorName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Inward Quantity Grid
                  </Label>
                  <div className="border border-zinc-150 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                            Material
                          </th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                            Ordered
                          </th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                            Received
                          </th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right pr-6 w-32">
                            Receiving Now
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {selectedPO.items?.map((item: any, idx: number) => {
                          const itemId = item.itemId?._id || item.itemId;
                          const name =
                            item.itemId?.itemName ||
                            item.itemId?.name ||
                            "Material";
                          const unit = getItemUnit(item);
                          const remaining =
                            (item.orderQuantity || 0) -
                            (item.receivedQuantity || 0);

                          return (
                            <tr key={idx}>
                              <td className="px-4 py-4 text-xs font-bold text-zinc-800">
                                {name}
                              </td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.orderQuantity} {unit}
                              </td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.receivedQuantity || 0} {unit}
                              </td>
                              <td className="px-4 py-4 text-right pr-6 w-32">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remaining}
                                    value={
                                      receiveQuantities[itemId] !== undefined
                                        ? receiveQuantities[itemId]
                                        : remaining
                                    }
                                    onChange={(e) => {
                                      const val = Math.max(
                                        0,
                                        Math.min(
                                          remaining,
                                          Number(e.target.value) || 0
                                        )
                                      );
                                      setReceiveQuantities((prev) => ({
                                        ...prev,
                                        [itemId]: val
                                      }));
                                    }}
                                    disabled={remaining <= 0}
                                    className="h-9 w-24 text-right rounded-lg bg-zinc-50 border-zinc-200 font-bold text-xs pr-7 disabled:bg-zinc-100"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 pointer-events-none">
                                    {unit}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsReceiveOpen(false);
                      setSelectedPO(null);
                    }}
                    className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReceiveSubmit}
                    disabled={isReceivingSubmit}
                    className="h-14 flex-1 rounded-2xl bg-teal-600 text-white font-black shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isReceivingSubmit ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />{" "}
                        Recording...
                      </>
                    ) : (
                      <>
                        <Scale className="h-5 w-5" /> Save Inward Receipt
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog: Issue Material */}
        <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
          <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Box className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
                    Issue Material to Requester
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Supply Inward Stock to Requester
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedPO && (
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/20">
                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                        Purchase Order ID
                      </span>
                      <span className="text-sm font-black text-zinc-900 mt-1">
                        {selectedPO.poNo}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                        Requester / Project
                      </span>
                      <span className="text-sm font-black text-zinc-900 mt-1 truncate">
                        {selectedPO.receiverMaterial?.name || "Requester"} (
                        {selectedPO.projectId?.projectName ||
                          selectedPO.projectId?.name ||
                          "N/A"}
                        )
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Supply Quantity Grid
                  </Label>
                  <div className="border border-zinc-150 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                            Material
                          </th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                            Received
                          </th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                            Already Issued
                          </th>
                          <th className="px-4 py-3.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right pr-6 w-32">
                            Supplying Now
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {selectedPO.items?.map((item: any, idx: number) => {
                          const itemId = item.itemId?._id || item.itemId;
                          const name =
                            item.itemId?.itemName ||
                            item.itemId?.name ||
                            "Material";
                          const unit = getItemUnit(item);
                          const remainingToIssue =
                            (item.receivedQuantity || 0) -
                            (item.issuedToRequesterQuantity || 0);

                          return (
                            <tr key={idx}>
                              <td className="px-4 py-4 text-xs font-bold text-zinc-800">
                                {name}
                              </td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.receivedQuantity || 0} {unit}
                              </td>
                              <td className="px-4 py-4 text-xs text-center font-bold text-zinc-500">
                                {item.issuedToRequesterQuantity || 0} {unit}
                              </td>
                              <td className="px-4 py-4 text-right pr-6 w-32">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remainingToIssue}
                                    value={
                                      issueQuantities[itemId] !== undefined
                                        ? issueQuantities[itemId]
                                        : remainingToIssue
                                    }
                                    onChange={(e) => {
                                      const val = Math.max(
                                        0,
                                        Math.min(
                                          remainingToIssue,
                                          Number(e.target.value) || 0
                                        )
                                      );
                                      setIssueQuantities((prev) => ({
                                        ...prev,
                                        [itemId]: val
                                      }));
                                    }}
                                    disabled={remainingToIssue <= 0}
                                    className="h-9 w-24 text-right rounded-lg bg-zinc-50 border-zinc-200 font-bold text-xs pr-7 disabled:bg-zinc-100"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 pointer-events-none">
                                    {unit}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsIssueOpen(false);
                      setSelectedPO(null);
                    }}
                    className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleIssueSubmit}
                    disabled={isIssuingSubmit}
                    className="h-14 flex-1 rounded-2xl bg-purple-600 text-white font-black shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isIssuingSubmit ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />{" "}
                        Supplying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" /> Confirm Issue Supply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Inward Slip Details Modal */}
        <Dialog open={!!selectedInwardRow} onOpenChange={(open) => !open && setSelectedInwardRow(null)}>
          <DialogContent className="max-w-3xl rounded-[2rem] p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col border-none shadow-2xl">
            {selectedInwardRow && (
              <>
                <DialogHeader className="p-6 bg-gradient-to-br from-teal-50/70 via-white to-zinc-50 border-b border-zinc-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                          Inward Delivery Details
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            {selectedInwardRow.verificationStatus || "Approved"}
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-400 font-medium">
                          Official Goods Inward Slip • Slip No:{" "}
                          <span className="font-mono font-bold text-zinc-700">
                            {selectedInwardRow.receiptNo}
                          </span>
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Grid Metadata Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</p>
                      <p className="text-sm font-bold text-zinc-900 mt-0.5">{selectedInwardRow.date}</p>
                    </div>

                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PO Number</p>
                      <p className="text-sm font-mono font-black text-teal-700 mt-0.5">{selectedInwardRow.poNo}</p>
                    </div>

                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vehicle No</p>
                      <p className="text-sm font-mono font-bold text-zinc-800 mt-0.5">{selectedInwardRow.vehicleNo || "—"}</p>
                    </div>

                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Received By</p>
                      <p className="text-sm font-bold text-zinc-800 mt-0.5 truncate">{selectedInwardRow.recdBy || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-zinc-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vendor Information</p>
                      <p className="text-base font-black text-zinc-900 mt-1">{selectedInwardRow.vendorName}</p>
                      {selectedInwardRow.po?.vendorMobile && (
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">Contact: {selectedInwardRow.po.vendorMobile}</p>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-zinc-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Project / Site Location</p>
                      <p className="text-base font-black text-zinc-900 mt-1">{selectedInwardRow.projectName}</p>
                      {selectedInwardRow.po?.locationAddress && (
                        <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate">{selectedInwardRow.po.locationAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Materials Delivered Manifest Table */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Items Delivered in this Slip</p>
                    <div className="rounded-xl border border-zinc-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-black uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-4">#</th>
                            <th className="py-2.5 px-4">Material / Item</th>
                            <th className="py-2.5 px-4 text-right">Delivered Quantity</th>
                            <th className="py-2.5 px-4 text-center">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {selectedInwardRow.items && selectedInwardRow.items.length > 0 ? (
                            selectedInwardRow.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="py-2.5 px-4 font-bold text-zinc-400">{idx + 1}</td>
                                <td className="py-2.5 px-4 font-black text-zinc-900">{item.name}</td>
                                <td className="py-2.5 px-4 text-right font-black text-teal-700">{item.qty}</td>
                                <td className="py-2.5 px-4 text-center font-bold text-zinc-500">{item.unit || "Nos"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-zinc-400 font-semibold">
                                {selectedInwardRow.itemDescription || "General Goods Inward"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-zinc-50/50 border-t border-zinc-200 font-black">
                          <tr>
                            <td colSpan={2} className="py-2 px-4 uppercase text-[10px] text-zinc-500">Total Actual Count</td>
                            <td className="py-2 px-4 text-right text-teal-800 text-sm font-black">{selectedInwardRow.actualCount}</td>
                            <td className="py-2 px-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Delivery Attachments / Photos */}
                  {(selectedInwardRow.billPhoto || selectedInwardRow.materialPhoto) && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Delivery Documents & Photos</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedInwardRow.billPhoto && (
                          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Invoice / Bill Document</span>
                            <img
                              src={getImageUrl(selectedInwardRow.billPhoto)}
                              alt="Invoice photo"
                              className="w-full h-40 object-cover rounded-lg border border-zinc-200 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(getImageUrl(selectedInwardRow.billPhoto!), "_blank")}
                            />
                          </div>
                        )}
                        {selectedInwardRow.materialPhoto && (
                          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Material Unloading Photo</span>
                            <img
                              src={getImageUrl(selectedInwardRow.materialPhoto)}
                              alt="Material photo"
                              className="w-full h-40 object-cover rounded-lg border border-zinc-200 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(getImageUrl(selectedInwardRow.materialPhoto!), "_blank")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedInwardRow.remarks && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Remarks</p>
                      <p className="text-xs text-amber-900 mt-1 font-medium">{selectedInwardRow.remarks}</p>
                    </div>
                  )}
                </div>

                <DialogFooter className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between sm:justify-between">
                  {selectedInwardRow.poId ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/material/${selectedInwardRow.poId}`);
                      }}
                      className="gap-2 font-bold text-xs rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Full PO Material Details
                    </Button>
                  ) : <div />}

                  <Button
                    onClick={() => setSelectedInwardRow(null)}
                    className="h-10 px-6 rounded-xl font-bold text-xs bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  );
}
