"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Loader2,
  Search,
  Printer,
  Download,
  Building,
  RefreshCw,
  BookOpen,
  Filter,
  PackageCheck,
  FileSpreadsheet,
} from "lucide-react";
import { purchaseOrderService } from "@/service/purchaseOrderService";
import { useUnits } from "@/hooks/use-units";
import { useItems } from "@/hooks/use-items";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface InwardRegisterRow {
  id: string;
  srNo: number;
  date: string;
  rawDate: Date;
  vendorName: string;
  receiptNo: string;
  poNo: string;
  projectName: string;
  itemDescription: string;
  qty: string;
  items: Array<{ name: string; qty: number | string; unit: string }>;
  vehicleNo: string;
  actualCount: string | number;
  recdBy: string;
}

const person = (value: any) =>
  value?.name ||
  value?.fullName ||
  value?.employeeName ||
  value?.userName ||
  "";

function getFinancialYearString(dateVal?: unknown): string {
  const d = dateVal ? new Date(dateVal as string) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  let year = validDate.getFullYear();
  let month = validDate.getMonth() + 1;

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
  } catch {}

  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = String((fyStart + 1) % 100).padStart(2, "0");
  return `${fyStart}-${fyEnd}`;
}

export default function LedgerInwardRegisterPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const printAreaRef = useRef<HTMLDivElement>(null);

  const { units } = useUnits(true, 1000);
  const { items: allItems } = useItems(true, 1000);

  const unitsMap = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => {
      if (u.id) map.set(String(u.id), u.label || u.value);
      if (u.value) map.set(String(u.value), u.label || u.value);
    });
    return map;
  }, [units]);

  const resolveUnit = (unitRef: any, itemRef?: any): string => {
    if (unitRef && typeof unitRef === "object") {
      const u = unitRef.unitName || unitRef.name || unitRef.label || unitRef.value;
      if (u) return u;
    }
    if (unitRef && typeof unitRef === "string") {
      const matched = unitsMap.get(unitRef);
      if (matched) return matched;
    }
    if (itemRef && typeof itemRef === "object") {
      if (itemRef.unitId) {
        if (typeof itemRef.unitId === "object") {
          const u = itemRef.unitId.unitName || itemRef.unitId.name || itemRef.unitId.label || itemRef.unitId.value;
          if (u) return u;
        } else if (typeof itemRef.unitId === "string") {
          const matched = unitsMap.get(itemRef.unitId);
          if (matched) return matched;
        }
      }
      if (itemRef.unit) return itemRef.unit;
    }
    const rawItemId = typeof itemRef === "string" ? itemRef : itemRef?._id || itemRef?.id;
    if (rawItemId) {
      const found = allItems.find((it) => it.id === rawItemId);
      if (found) {
        if (found.unit) return found.unit;
        if (found.unitId && unitsMap.has(found.unitId)) return unitsMap.get(found.unitId)!;
      }
    }
    return "";
  };

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const response = await purchaseOrderService.getPurchaseOrders({
        limit: 500,
      });
      const pos = response.data || [];
      setPurchaseOrders(pos);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load ledger records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  // Flatten Purchase Orders & Receipts into Inward Register rows
  const registerRows: InwardRegisterRow[] = useMemo(() => {
    const rows: InwardRegisterRow[] = [];

    purchaseOrders.forEach((po) => {
      const receipts = (po.receipts || []).filter(
        (r: any) =>
          String(r.verificationStatus || "").toLowerCase() === "approved" ||
          !r.verificationStatus
      );

      const projectName =
        po.projectId?.projectName ||
        po.projectId?.name ||
        po.locationAddress ||
        po.deliveryAddress ||
        "—";

      const vendorName =
        po.vendorName ||
        po.vendorId?.vendorName ||
        po.vendorId?.companyName ||
        po.vendorId?.name ||
        "—";

      if (receipts.length > 0) {
        receipts.forEach((receipt: any, rIdx: number) => {
          const rawDate = new Date(
            receipt.receiptDate || receipt.createdAt || po.createdAt || Date.now()
          );
          const dateStr = !isNaN(rawDate.getTime())
            ? rawDate.toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "—";

          const slipNo =
            receipt.slipNo ||
            po.latestSlipNo ||
            `${getFinancialYearString(rawDate)}/${String(rIdx + 1).padStart(2, "0")}`;

          const vehicleNo =
            receipt.vehicleNo ||
            receipt.vehicleNumber ||
            po.vehicleNo ||
            po.vehicleNumber ||
            "—";

          const recdBy =
            person(receipt.receivedBy) ||
            receipt.receiverName ||
            person(po.receiverMaterial) ||
            person(po.requestedBy) ||
            "—";

          // Items inside this receipt
          const rItems = receipt.items || [];
          if (rItems.length > 0) {
            const itemDescs: string[] = [];
            const qtys: string[] = [];
            const parsedItems: Array<{ name: string; qty: number | string; unit: string }> = [];
            let totalActualQty = 0;

            rItems.forEach((ri: any) => {
              const matchedPOItem = (po.items || []).find(
                (pi: any) =>
                  String(pi.itemId?._id || pi.itemId?.id || pi.itemId) ===
                  String(ri.itemId?._id || ri.itemId?.id || ri.itemId)
              );
              const name =
                ri.itemId?.itemName ||
                ri.itemId?.name ||
                matchedPOItem?.itemId?.itemName ||
                matchedPOItem?.itemId?.name ||
                "Material";
              const unit =
                resolveUnit(ri.unitId, ri.itemId) ||
                resolveUnit(matchedPOItem?.unitId, matchedPOItem?.itemId) ||
                "Nos";
              const qtyNum = Number(ri.suppliedQuantity ?? ri.receivedQuantity ?? 0);
              totalActualQty += qtyNum;

              itemDescs.push(name);
              qtys.push(`${qtyNum}${unit ? ` ${unit}` : ""}`);
              parsedItems.push({
                name,
                qty: qtyNum,
                unit,
              });
            });

            rows.push({
              id: `${po._id || po.id}-${receipt._id || rIdx}`,
              srNo: 0,
              date: dateStr,
              rawDate,
              vendorName,
              receiptNo: slipNo,
              poNo: po.poNo || "—",
              projectName,
              itemDescription: itemDescs.join(", "),
              qty: qtys.join(", "),
              items: parsedItems,
              vehicleNo,
              actualCount: totalActualQty || "—",
              recdBy,
            });
          } else {
            rows.push({
              id: `${po._id || po.id}-${receipt._id || rIdx}`,
              srNo: 0,
              date: dateStr,
              rawDate,
              vendorName,
              receiptNo: slipNo,
              poNo: po.poNo || "—",
              projectName,
              itemDescription: "Goods Inward",
              qty: "—",
              items: [],
              vehicleNo,
              actualCount: "—",
              recdBy,
            });
          }
        });
      } else if (
        ["PartiallyReceived", "Received", "Completed", "Issued"].includes(
          po.status
        )
      ) {
        // Fallback for orders marked received directly
        const rawDate = new Date(po.updatedAt || po.createdAt || Date.now());
        const dateStr = !isNaN(rawDate.getTime())
          ? rawDate.toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "—";

        const poItems = po.items || [];
        const itemDescs = poItems.map(
          (pi: any) => pi.itemId?.itemName || pi.itemId?.name || "Material"
        );
        const parsedItems: Array<{ name: string; qty: number | string; unit: string }> = [];
        const qtys = poItems.map((pi: any) => {
          const name = pi.itemId?.itemName || pi.itemId?.name || "Material";
          const unit = resolveUnit(pi.unitId, pi.itemId) || "Nos";
          const qty = Number(pi.receivedQuantity || pi.orderQuantity || 0);
          parsedItems.push({ name, qty, unit });
          return `${qty}${unit ? ` ${unit}` : ""}`;
        });
        const totalCount = poItems.reduce(
          (acc: number, pi: any) =>
            acc + Number(pi.receivedQuantity || pi.orderQuantity || 0),
          0
        );

        rows.push({
          id: `${po._id || po.id}-po`,
          srNo: 0,
          date: dateStr,
          rawDate,
          vendorName,
          receiptNo: po.latestSlipNo || po.poNo || "—",
          poNo: po.poNo || "—",
          projectName,
          itemDescription: itemDescs.join(", ") || "Materials",
          qty: qtys.join(", ") || "—",
          items: parsedItems,
          vehicleNo: po.vehicleNo || po.vehicleNumber || "—",
          actualCount: totalCount || "—",
          recdBy: person(po.receiverMaterial) || person(po.requestedBy) || "—",
        });
      }
    });

    // Sort descending by rawDate, then assign sequential Sr. No
    rows.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    return rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
    }));
  }, [purchaseOrders, resolveUnit]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return registerRows;
    const q = searchQuery.toLowerCase();
    return registerRows.filter(
      (r) =>
        r.vendorName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.receiptNo.toLowerCase().includes(q) ||
        r.poNo.toLowerCase().includes(q) ||
        r.itemDescription.toLowerCase().includes(q) ||
        r.vehicleNo.toLowerCase().includes(q) ||
        r.recdBy.toLowerCase().includes(q)
    );
  }, [registerRows, searchQuery]);

  // Handle Printable Register (without Sign & Stamp as requested in user handwriting)
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      toast.error("Please allow popups to print the inward register.");
      return;
    }

    const tableRowsHtml = filteredRows
      .map(
        (row) => {
          const itemNamesHtml = row.items && row.items.length > 0
            ? row.items.map((i) => `<div style="margin-bottom: 2px; font-weight: 600;">${i.name}</div>`).join("")
            : (row.itemDescription || "—");

          const qtyHtml = row.items && row.items.length > 0
            ? row.items.map((i) => `<div style="margin-bottom: 2px; font-weight: bold;">${i.qty} ${i.unit}</div>`).join("")
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
        }
      )
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
              <span>Total Inward Records: ${filteredRows.length}</span>
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
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No entries to export.");
      return;
    }
    const headers = [
      "Sr. No",
      "Date",
      "Vendor Name",
      "Receipt No. / Slip No.",
      "PO Number",
      "Project Name",
      "Item Name",
      "Qty",
      "Vehicle No",
      "Actual Count",
      "Recd By",
    ];

    const rowsData = filteredRows.map((r) => {
      const itemNames = r.items && r.items.length > 0
        ? r.items.map((i) => i.name).join("; ")
        : r.itemDescription;

      const qtys = r.items && r.items.length > 0
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
    link.setAttribute("download", `Ledger_Inward_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inward register downloaded as CSV");
  };

  const columns: ColumnDef<InwardRegisterRow>[] = [
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
        <Badge
          variant="outline"
          className="font-mono font-bold text-xs bg-teal-50 text-teal-800 border-teal-200"
        >
          {row.original.receiptNo}
        </Badge>
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
      accessorKey: "actualCount",
      header: () => <div className="text-center">Actual Count</div>,
      cell: ({ row }) => (
        <div className="text-center font-black text-zinc-900 tabular-nums">
          {row.original.actualCount}
        </div>
      ),
    },
    {
      accessorKey: "recdBy",
      header: "Recd By",
      cell: ({ row }) => (
        <span className="font-semibold text-zinc-800 text-xs">
          {row.original.recdBy}
        </span>
      ),
    },
  ];

  return (
    <ContentLayout title="Ledger Inward Register">
      <div className="flex flex-col gap-8 p-6 sm:p-12 max-w-[1650px] mx-auto min-h-screen">
        {/* Header Control Hub */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-teal-600" />
              Ledger Inward Register
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em]">
                Official Goods Inward & Shipment Receiving Register
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72 shrink-0">
              <Input
                placeholder="Search vendor, project, slip no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl bg-white border-zinc-200 pl-10 font-medium text-sm shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>

            <Button
              onClick={handlePrint}
              className="h-11 rounded-xl px-5 font-bold shadow-sm bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Register
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-11 rounded-xl px-4 font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              onClick={fetchLedgerData}
              className="h-11 w-11 rounded-xl p-0 border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              title="Refresh ledger"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Inward Entries
              </p>
              <p className="text-2xl font-black text-zinc-900 mt-1">
                {registerRows.length}
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
                {new Set(registerRows.map((r) => r.vendorName)).size}
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
                {new Set(registerRows.map((r) => r.projectName)).size}
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
                {filteredRows.length}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Inward Register Table Card */}
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
                  Showing all inward slips and recorded deliveries
                </p>
              </div>
            </div>
            <Badge variant="outline" className="font-semibold text-xs py-1 px-3">
              {filteredRows.length} Records
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
              <p className="text-zinc-500 font-bold text-sm">
                Loading inward register...
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredRows} />
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
