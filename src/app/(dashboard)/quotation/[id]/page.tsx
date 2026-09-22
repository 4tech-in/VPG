"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2, Phone, Printer, Send } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { indentService } from "@/service/indents.api";
import { WhatsAppIcon } from "@/components/purchase-order/send-whatsapp-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [indent, setIndent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Send to vendor modal state
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [vendorMobile, setVendorMobile] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [attachFormat, setAttachFormat] = useState<"docx" | "pdf">("docx");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    setLoading(true);
    indentService
      .getIndentById(id)
      .then(setIndent)
      .catch((error) => toast.error(error?.message || "Unable to load quotation details"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const items = useMemo(
    () =>
      (indent?.items || []).map((entry: any, index: number) => {
        const item = entry.itemId || {};
        const quantity = Number(entry.quantity || 0);
        return {
          id: item._id || index,
          code: item.itemCode || item.newItemCode || item.HSNcode || item.code || "—",
          name: item.itemName || item.name || "Unknown item",
          specification: item.specification || item.unindentSpecification || item.extraNote || "",
          quantity,
          unit:
            entry.unitId?.label ||
            entry.unitId?.unitName ||
            entry.unitId?.value ||
            item.unitId?.label ||
            item.unitId?.unitName ||
            item.unitId?.name ||
            "Units",
        };
      }),
    [indent]
  );

  const projectName = indent?.projectId?.projectName || indent?.projectId?.name || "—";
  const rfqRef = indent?.indentId || indent?.indentNo || "—";

  const formatDate = (val: unknown) => {
    if (!val) return "—";
    const d = new Date(val as string);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const printQuotation = () => {
    const node = document.getElementById("rfq-document-preview");
    if (!node) return;
    const popup = window.open("", "_blank", "width=850,height=1100");
    if (!popup) {
      toast.error("Please allow popups to print.");
      return;
    }
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((item) => item.outerHTML)
      .join("");
    popup.document.write(`<!doctype html><html><head><title>RFQ - ${rfqRef}</title>${styles}<style>@page{size:A4 portrait;margin:10mm}*{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}body{margin:0;background:#fff!important}#rfq-document-preview{width:100%!important;max-width:none!important;box-shadow:none!important;border:none!important;padding:0!important}</style></head><body>${node.outerHTML}</body></html>`);
    popup.document.close();
    popup.focus();
    const imgs = Array.from(popup.document.images);
    if (imgs.length > 0) {
      Promise.all(imgs.map((img) => img.decode().catch(() => {}))).finally(() => {
        window.setTimeout(() => {
          popup.print();
          popup.close();
        }, 300);
      });
    } else {
      window.setTimeout(() => {
        popup.print();
        popup.close();
      }, 500);
    }
  };

  const downloadPdf = async () => {
    const node = document.getElementById("rfq-document-preview");
    if (!node) return;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const pdfWidth = canvas.width * ratio;
      const pdfHeight = canvas.height * ratio;
      const x = (pageWidth - pdfWidth) / 2;
      const y = margin;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, pdfWidth, pdfHeight);
      pdf.save(`RFQ_${rfqRef}.pdf`);
      toast.success("RFQ PDF downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const generateRfqDocxBlob = async (): Promise<Blob> => {
    const borderGray = { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" };
    const tableBorders = {
      top: borderGray,
      bottom: borderGray,
      left: borderGray,
      right: borderGray,
      insideHorizontal: borderGray,
      insideVertical: borderGray,
    };
    const borderNone = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const noBorders = {
      top: borderNone,
      bottom: borderNone,
      left: borderNone,
      right: borderNone,
      insideHorizontal: borderNone,
      insideVertical: borderNone,
    };

    const cell = (
      text: string,
      width: number,
      options?: {
        bold?: boolean;
        header?: boolean;
        align?: (typeof AlignmentType)[keyof typeof AlignmentType];
        shading?: any;
        borders?: any;
        size?: number;
        color?: string;
      }
    ) =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        borders: options?.borders || tableBorders,
        shading:
          options?.shading ||
          (options?.header
            ? { fill: "1B1B42", type: ShadingType.CLEAR, color: "auto" }
            : undefined),
        children: [
          new Paragraph({
            alignment: options?.align || AlignmentType.LEFT,
            spacing: { before: 0, after: 0, line: 260 },
            children: [
              new TextRun({
                text: text || "",
                bold: Boolean(options?.bold ?? options?.header),
                color: options?.color || (options?.header ? "FFFFFF" : "1F2937"),
                font: "Arial",
                size: options?.size || 20,
              }),
            ],
          }),
        ],
      });

    const itemRows = items.map((item: any, index: number) =>
      new TableRow({
        cantSplit: true,
        children: [
          cell(String(index + 1), 600, { align: AlignmentType.CENTER, bold: true }),
          cell(`${item.name}${item.specification ? ` (${item.specification})` : ""}`, 3900),
          cell(item.code || "—", 1200, { align: AlignmentType.CENTER }),
          cell(item.unit || "Units", 1000, { align: AlignmentType.CENTER }),
          cell(String(item.quantity), 1000, { align: AlignmentType.CENTER, bold: true }),
          cell("", 1300, { align: AlignmentType.RIGHT }),
          cell("", 1400, { align: AlignmentType.RIGHT }),
        ],
      })
    );

    const emptyRowsCount = Math.max(0, 3 - items.length);
    const emptyRows = Array.from({ length: emptyRowsCount }).map(
      () =>
        new TableRow({
          cantSplit: true,
          children: [
            cell("", 600),
            cell("", 3900),
            cell("", 1200),
            cell("", 1000),
            cell("", 1000),
            cell("", 1300),
            cell("", 1400),
          ],
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          children: [
            // Company Header
            new Table({
              width: { size: 10400, type: WidthType.DXA },
              borders: noBorders,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 5200, type: WidthType.DXA },
                      borders: noBorders,
                      children: [
                        new Paragraph({
                          spacing: { before: 0, after: 60 },
                          children: [
                            new TextRun({
                              text: "VPG CONSTRUCTION PVT. LTD.",
                              bold: true,
                              size: 26,
                              color: "1B1B42",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 0 },
                          children: [
                            new TextRun({
                              text: "Quality • Integrity • Excellence",
                              italics: true,
                              size: 18,
                              color: "64748B",
                              font: "Arial",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 5200, type: WidthType.DXA },
                      borders: noBorders,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 40 },
                          children: [
                            new TextRun({
                              text: "+91 9888889139, +91 9872307900",
                              bold: true,
                              size: 18,
                              color: "1F2937",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 40 },
                          children: [
                            new TextRun({
                              text: "admin@vpgconstruction.co.in",
                              size: 18,
                              color: "1F2937",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 40 },
                          children: [
                            new TextRun({
                              text: "SCO 27, Kalgidhar Enclave, Baltana, Zirakpur",
                              size: 18,
                              color: "1F2937",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 0 },
                          children: [
                            new TextRun({
                              text: "www.vpgconstruction.co.in",
                              size: 18,
                              color: "0077B6",
                              font: "Arial",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Top Divider Line
            new Paragraph({
              spacing: { before: 140, after: 200 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 16, color: "1B1B42" },
              },
              children: [],
            }),

            // Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 220 },
              children: [
                new TextRun({
                  text: "REQUEST FOR QUOTATION",
                  bold: true,
                  size: 30,
                  color: "1B1B42",
                  font: "Arial",
                }),
              ],
            }),

            // RFQ Meta Info 2-column grid
            new Table({
              width: { size: 10400, type: WidthType.DXA },
              borders: noBorders,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 5200, type: WidthType.DXA },
                      borders: noBorders,
                      children: [
                        new Paragraph({
                          spacing: { before: 0, after: 80 },
                          children: [
                            new TextRun({ text: "RFQ Ref No: ", bold: true, size: 20, color: "475569", font: "Arial" }),
                            new TextRun({ text: String(rfqRef), bold: true, size: 20, color: "0F172A", font: "Arial" }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 80 },
                          children: [
                            new TextRun({ text: "Dated: ", bold: true, size: 20, color: "475569", font: "Arial" }),
                            new TextRun({ text: formatDate(indent?.createdAt), size: 20, color: "0F172A", font: "Arial" }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 120 },
                          children: [
                            new TextRun({ text: "Storage Location: ", bold: true, size: 20, color: "475569", font: "Arial" }),
                            new TextRun({ text: String(indent?.storageLocation || "Site"), size: 20, color: "0F172A", font: "Arial" }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 5200, type: WidthType.DXA },
                      borders: noBorders,
                      children: [
                        new Paragraph({
                          spacing: { before: 0, after: 80 },
                          children: [
                            new TextRun({ text: "Est. Delivery Date: ", bold: true, size: 20, color: "475569", font: "Arial" }),
                            new TextRun({
                              text: formatDate(indent?.estimateDeliveryDate || indent?.expectedDeliveryDate),
                              size: 20,
                              color: "0F172A",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 80 },
                          children: [
                            new TextRun({ text: "Project: ", bold: true, size: 20, color: "475569", font: "Arial" }),
                            new TextRun({ text: String(projectName), bold: true, size: 20, color: "0F172A", font: "Arial" }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 120 },
                          children: [
                            new TextRun({ text: "Priority: ", bold: true, size: 20, color: "475569", font: "Arial" }),
                            new TextRun({ text: String(indent?.priority || "Medium"), size: 20, color: "0F172A", font: "Arial" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Issued By / Vendor Supplier Details Table
            new Table({
              width: { size: 10400, type: WidthType.DXA },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    cell("ISSUED BY", 5200, {
                      header: true,
                      bold: true,
                      color: "FFFFFF",
                      size: 20,
                    }),
                    cell("VENDOR / SUPPLIER (To be filled by Vendor)", 5200, {
                      header: true,
                      bold: true,
                      color: "FFFFFF",
                      size: 20,
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    cell("COMPANY NAME: VPG CONSTRUCTION PVT. LTD.", 5200, { size: 20 }),
                    cell("COMPANY NAME:", 5200, { size: 20 }),
                  ],
                }),
                new TableRow({
                  children: [
                    cell("ADDRESS: SCO 27, Kalgidhar Enclave, Baltana, Zirakpur", 5200, { size: 20 }),
                    cell("ADDRESS:", 5200, { size: 20 }),
                  ],
                }),
                new TableRow({
                  children: [
                    cell("GST NO: 03AAWCS2873A1ZB", 5200, { bold: true, size: 20 }),
                    cell("GST NO:", 5200, { size: 20 }),
                  ],
                }),
                new TableRow({
                  children: [
                    cell("CONTACT DETAILS: +91 9888889139, +91 9872307900", 5200, { size: 20 }),
                    cell("VENDOR QUOTATION REF: Quot Ref No: ________", 5200, { size: 20 }),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),

            // Items Table
            new Table({
              width: { size: 10400, type: WidthType.DXA },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    cell("SR", 600, { header: true, align: AlignmentType.CENTER, bold: true }),
                    cell("DESCRIPTION", 3900, { header: true, align: AlignmentType.LEFT, bold: true }),
                    cell("CODE", 1200, { header: true, align: AlignmentType.CENTER, bold: true }),
                    cell("UNIT", 1000, { header: true, align: AlignmentType.CENTER, bold: true }),
                    cell("QTY", 1000, { header: true, align: AlignmentType.CENTER, bold: true }),
                    cell("RATE (₹)", 1300, { header: true, align: AlignmentType.CENTER, bold: true }),
                    cell("TOTAL (₹)", 1400, { header: true, align: AlignmentType.CENTER, bold: true }),
                  ],
                }),
                ...itemRows,
                ...emptyRows,
              ],
            }),

            new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),

            // Totals and Terms Section
            new Table({
              width: { size: 10400, type: WidthType.DXA },
              borders: noBorders,
              rows: [
                new TableRow({
                  children: [
                    // Terms & Signature (Left)
                    new TableCell({
                      width: { size: 5800, type: WidthType.DXA },
                      borders: noBorders,
                      children: [
                        new Paragraph({
                          spacing: { before: 0, after: 80 },
                          children: [
                            new TextRun({
                              text: "Terms & Instructions:",
                              bold: true,
                              size: 21,
                              color: "1B1B42",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 40 },
                          children: [
                            new TextRun({
                              text: "1. Please quote your lowest competitive rates including GST, freight & delivery charges.",
                              size: 19,
                              color: "334155",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 40 },
                          children: [
                            new TextRun({
                              text: "2. Mention validity period of quotation and payment terms clearly.",
                              size: 19,
                              color: "334155",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 0, after: 160 },
                          children: [
                            new TextRun({
                              text: "3. Specify delivery schedule & transport mode for the requested site.",
                              size: 19,
                              color: "334155",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 140, after: 60 },
                          children: [
                            new TextRun({
                              text: "For VPG Construction Private Limited",
                              bold: true,
                              size: 21,
                              color: "1B1B42",
                              font: "Arial",
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 160, after: 0 },
                          children: [
                            new TextRun({
                              text: "Authorized Signatory",
                              bold: true,
                              size: 19,
                              color: "475569",
                              font: "Arial",
                            }),
                          ],
                        }),
                      ],
                    }),
                    // Totals Table (Right)
                    new TableCell({
                      width: { size: 4600, type: WidthType.DXA },
                      borders: noBorders,
                      children: [
                        new Table({
                          width: { size: 4600, type: WidthType.DXA },
                          rows: [
                            new TableRow({
                              children: [
                                cell("Subtotal Amount", 2600, { bold: true }),
                                cell("", 2000),
                              ],
                            }),
                            new TableRow({
                              children: [
                                cell("Freight Charges", 2600, { bold: true }),
                                cell("", 2000),
                              ],
                            }),
                            new TableRow({
                              children: [
                                cell("Packaging / Other Charges", 2600, { bold: true }),
                                cell("", 2000),
                              ],
                            }),
                            new TableRow({
                              children: [
                                cell("GST (%) & Amount", 2600, { bold: true }),
                                cell("", 2000),
                              ],
                            }),
                            new TableRow({
                              children: [
                                cell("Grand Total Price", 2600, {
                                  bold: true,
                                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR, color: "auto" },
                                }),
                                cell("", 2000, {
                                  bold: true,
                                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR, color: "auto" },
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  };

  const downloadDocx = async () => {
    try {
      const blob = await generateRfqDocxBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RFQ_${rfqRef}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Quotation Word (DOCX) downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate Word (DOCX)");
    }
  };

  const handleSendWhatsApp = async () => {
    const cleanNumber = vendorMobile.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Download file in selected format (Word DOCX by default)
      if (attachFormat === "docx") {
        await downloadDocx();
      } else {
        await downloadPdf();
      }

      // 2. Open WhatsApp Web / App with message
      const defaultDocxMessage = `Hello,\n\nPlease find Request for Quotation (RFQ Ref: ${rfqRef}) in Word (.docx) format from VPG Construction Private Limited for Project: ${projectName}.\n\nItems Requested: ${items.length} item(s).\nPlease quote your best rates and delivery terms in the attached Word file.\n\nThank you.`;
      const defaultPdfMessage = `Hello,\n\nPlease find Request for Quotation (RFQ Ref: ${rfqRef}) from VPG Construction Private Limited for Project: ${projectName}.\n\nItems Requested: ${items.length} item(s).\nPlease quote your best rates and delivery terms.\n\nThank you.`;

      const defaultText = attachFormat === "docx" ? defaultDocxMessage : defaultPdfMessage;
      const msg = customMessage.trim() || defaultText;
      const phoneParam = cleanNumber.startsWith("91") && cleanNumber.length === 12 ? cleanNumber : `91${cleanNumber}`;
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");

      toast.success(
        attachFormat === "docx"
          ? "Word (.docx) downloaded! WhatsApp opened to attach and send."
          : "PDF downloaded! WhatsApp opened to attach and send."
      );
      setIsSendOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to initiate send");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <ContentLayout title="Quotation">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
        </div>
      </ContentLayout>
    );
  }

  if (!indent) {
    return (
      <ContentLayout title="Quotation">
        <div className="p-10 text-center font-bold text-zinc-500">Quotation details not found.</div>
      </ContentLayout>
    );
  }

  if (indent.status !== "Approved") {
    return (
      <ContentLayout title="Quotation">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="font-bold text-zinc-600">Quotation is available only for approved indents.</p>
          <Button variant="outline" onClick={() => router.push("/indent")}>
            Back to Indents
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={`Quotation: ${rfqRef}`}>
      {/* Top Action Header */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b bg-white/95 px-6 py-3.5 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-9 gap-1.5 font-bold text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-base font-extrabold text-zinc-900">
              Request for Quotation #{rfqRef}
            </h1>
            <p className="text-[11px] font-medium text-zinc-500">{projectName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={printQuotation}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Printer className="h-4 w-4 text-zinc-600" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Download className="h-4 w-4 text-zinc-600" /> Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDocx}
            className="h-9 gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
          >
            <FileText className="h-4 w-4 text-blue-600" /> Word (.docx)
          </Button>
          <Button
            onClick={() => setIsSendOpen(true)}
            className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm"
          >
            <WhatsAppIcon className="h-4 w-4" /> Send on WhatsApp (Word)
          </Button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="bg-stone-200/80 py-8 px-4 sm:px-6 min-h-[calc(100vh-65px)] overflow-x-auto">
        <div
          id="rfq-document-preview"
          className="mx-auto w-[820px] max-w-full bg-white shadow-xl border border-zinc-300 p-10 font-sans text-zinc-900"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3">
            <div className="flex items-center">
              <img src="/vpg.jpeg" alt="VPG Logo" className="h-16 w-auto object-contain" />
            </div>
            <div className="flex items-stretch gap-2.5 text-right">
              <div className="text-[11px] font-bold leading-5 text-zinc-800">
                <p>+91 9888889139, +91 9872307900</p>
                <p>admin@vpgconstruction.co.in</p>
                <p>SCO 27, Kalgidhar Enclave, Baltana, Zirakpur</p>
                <p>www.vpgconstruction.co.in</p>
              </div>
              <div className="flex w-6 overflow-hidden rounded-xs">
                <div className="w-2 bg-[#00b4d8]" />
                <div className="w-4 bg-[#1b1b42]" />
              </div>
            </div>
          </div>

          <div className="h-0.5 w-full bg-[#1b1b42] mb-6" />

          {/* Title */}
          <h1 className="text-center font-black text-xl tracking-wider text-[#1b1b42] mb-6 uppercase">
            REQUEST FOR QUOTATION
          </h1>

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-1.5 text-[12px] mb-5 font-bold text-zinc-900">
            <div className="space-y-1">
              <p>
                <span className="text-zinc-700 font-semibold">RFQ Ref No.:</span>{" "}
                <span className="font-extrabold">{rfqRef}</span>
              </p>
              <p>
                <span className="text-zinc-700 font-semibold">Dated:</span>{" "}
                <span className="font-normal">{formatDate(indent.createdAt)}</span>
              </p>
              <p>
                <span className="text-zinc-700 font-semibold">Storage Location:</span>{" "}
                <span className="font-normal">{indent.storageLocation || "Site"}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <span className="text-zinc-700 font-semibold">Est. Delivery Date:</span>{" "}
                <span className="font-normal">
                  {formatDate(indent.estimateDeliveryDate || indent.expectedDeliveryDate)}
                </span>
              </p>
              <p>
                <span className="text-zinc-700 font-semibold">Project:</span>{" "}
                <span className="font-normal">{projectName}</span>
              </p>
              <p>
                <span className="text-zinc-700 font-semibold">Priority:</span>{" "}
                <span className="font-normal capitalize">{indent.priority || "Medium"}</span>
              </p>
            </div>
          </div>

          {/* Issued By / Vendor Table */}
          <table className="w-full border-collapse border border-zinc-400 text-[11px] mb-5">
            <thead>
              <tr className="bg-[#1b1b42] text-white">
                <th className="w-1/2 p-2 text-left font-bold uppercase tracking-wider border-r border-zinc-400">
                  ISSUED BY
                </th>
                <th className="w-1/2 p-2 text-left font-bold uppercase tracking-wider">
                  VENDOR / SUPPLIER
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-zinc-100 font-bold text-zinc-700">
                <td className="p-1.5 border-r border-b border-zinc-400">COMPANY NAME</td>
                <td className="p-1.5 border-b border-zinc-400">COMPANY NAME</td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-b border-zinc-400 font-semibold">
                  VPG CONSTRUCTION PVT. LTD.
                </td>
                <td className="p-1.5 border-b border-zinc-400 font-normal">-</td>
              </tr>
              <tr className="bg-zinc-100 font-bold text-zinc-700">
                <td className="p-1.5 border-r border-b border-zinc-400">ADDRESS</td>
                <td className="p-1.5 border-b border-zinc-400">ADDRESS</td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-b border-zinc-400 font-semibold leading-tight">
                  SCO 27, Kalgidhar Enclave, Baltana, Zirakpur
                </td>
                <td className="p-1.5 border-b border-zinc-400 font-normal">-</td>
              </tr>
              <tr className="bg-zinc-100 font-bold text-zinc-700">
                <td className="p-1.5 border-r border-b border-zinc-400">
                  GST NO: <span className="font-semibold">03AAWCS2873A1ZB</span>
                </td>
                <td className="p-1.5 border-b border-zinc-400">GST NO:</td>
              </tr>
              <tr className="bg-zinc-100 font-bold text-zinc-700">
                <td className="p-1.5 border-r border-b border-zinc-400">CONTACT DETAILS</td>
                <td className="p-1.5 border-b border-zinc-400">VENDOR QUOTATION REF</td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-zinc-400 font-semibold">
                  +91 9888889139, +91 9872307900
                </td>
                <td className="p-1.5 border-zinc-400 font-normal">Quot Ref No:</td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table className="w-full border-collapse border border-zinc-400 text-[11px] mb-2">
            <thead>
              <tr className="bg-zinc-200 text-zinc-900 font-black">
                <th className="w-12 border border-zinc-400 p-2 text-center">SR</th>
                <th className="border border-zinc-400 p-2 text-center">DESCRIPTION</th>
                <th className="w-28 border border-zinc-400 p-2 text-center">CODE</th>
                <th className="w-20 border border-zinc-400 p-2 text-center">UNIT</th>
                <th className="w-20 border border-zinc-400 p-2 text-center">QTY</th>
                <th className="w-28 border border-zinc-400 p-2 text-center">RATE</th>
                <th className="w-28 border border-zinc-400 p-2 text-center">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={item.id} className="h-8">
                  <td className="border border-zinc-400 p-1.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-zinc-400 p-1.5 font-medium">{item.name}</td>
                  <td className="border border-zinc-400 p-1.5 text-center">{item.code}</td>
                  <td className="border border-zinc-400 p-1.5 text-center">{item.unit}</td>
                  <td className="border border-zinc-400 p-1.5 text-center font-bold">{item.quantity}</td>
                  <td className="border border-zinc-400 p-1.5"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="h-8">
                  <td className="border border-zinc-400 p-1.5 text-center"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                  <td className="border border-zinc-400 p-1.5"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Table Right-Aligned */}
          <div className="flex justify-end mb-6">
            <table className="w-72 border-collapse border border-zinc-400 text-[11px]">
              <tbody>
                <tr>
                  <td className="border border-zinc-400 p-1.5 font-semibold text-zinc-800">Subtotal Amount</td>
                  <td className="w-28 border border-zinc-400 p-1.5"></td>
                </tr>
                <tr>
                  <td className="border border-zinc-400 p-1.5 font-semibold text-zinc-800">Freight Charges</td>
                  <td className="w-28 border border-zinc-400 p-1.5"></td>
                </tr>
                <tr>
                  <td className="border border-zinc-400 p-1.5 font-semibold text-zinc-800">
                    Packaging / Other Charges
                  </td>
                  <td className="w-28 border border-zinc-400 p-1.5"></td>
                </tr>
                <tr>
                  <td className="border border-zinc-400 p-1.5 font-semibold text-zinc-800">GST (%) & Amount</td>
                  <td className="w-28 border border-zinc-400 p-1.5"></td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-zinc-400 p-1.5 text-zinc-900">Grand Total Price</td>
                  <td className="w-28 border border-zinc-400 p-1.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & Instructions */}
          <div className="text-[11px] leading-relaxed mb-6">
            <p className="font-bold text-zinc-900 mb-1">Terms & Instructions:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-zinc-700">
              <li>Please quote your lowest competitive rates including GST, freight & delivery charges.</li>
              <li>Mention validity period of quotation and payment terms clearly.</li>
              <li>Specify delivery schedule & transport mode for the requested site.</li>
            </ol>
          </div>

          {/* Signature Block */}
          <div className="mb-8">
            <p className="font-bold text-[12px] text-blue-900">For VPG Construction Private Limited</p>
            <img src="/image.png" alt="Signature" className="h-16 w-auto object-contain my-1" />
            <p className="font-bold text-[11px] text-zinc-800">Authorized Signatory</p>
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500">
            <div className="flex h-1.5 w-64 overflow-hidden rounded-full">
              <div className="w-1/3 bg-[#00b4d8]" />
              <div className="w-2/3 bg-[#1b1b42]" />
            </div>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>

      {/* Send to Vendor Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-zinc-900">
                  Send RFQ to Vendor
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-zinc-500">
                  Deliver the Request for Quotation to the vendor on WhatsApp.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-500">RFQ Reference:</span>
              <span className="text-zinc-900 font-extrabold">{rfqRef}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-500">Project:</span>
              <span className="text-zinc-900">{projectName}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-500">Requested Items:</span>
              <span className="text-emerald-700 font-black">{items.length} item(s)</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 py-2">
            {/* Attachment Format Selector */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-black text-zinc-700">
                Attachment Format <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttachFormat("docx")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    attachFormat === "docx"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-extrabold">Word (.docx)</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                    Default / Vendor Rates
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttachFormat("pdf")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    attachFormat === "pdf"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/20"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Download className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-extrabold">PDF (.pdf)</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Read-only copy
                  </span>
                </button>
              </div>
              <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                {attachFormat === "docx"
                  ? "✓ Quotation Word (.docx) downloads automatically so you can attach it to the WhatsApp chat for vendor rate filling."
                  : "✓ Quotation PDF downloads automatically so you can attach it to the WhatsApp chat."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rfqVendorMobile" className="text-xs font-black text-zinc-700 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                Vendor WhatsApp Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="rfqVendorMobile"
                placeholder="e.g. 9876543210"
                value={vendorMobile}
                onChange={(e) => setVendorMobile(e.target.value)}
                className="h-10 rounded-xl font-bold bg-white text-zinc-900 border-zinc-200 focus-visible:ring-emerald-500"
                disabled={isSending}
              />
              <p className="text-[10px] font-medium text-zinc-400">
                Enter 10-digit number. Country code (+91) is handled automatically.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rfqCustomMessage" className="text-xs font-black text-zinc-700">
                Custom Message / Note <span className="text-zinc-400 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="rfqCustomMessage"
                placeholder={
                  attachFormat === "docx"
                    ? "Leave empty to send default RFQ message with Word (.docx) instructions..."
                    : "Leave empty to send default RFQ message..."
                }
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="rounded-xl text-xs font-medium bg-white text-zinc-900 border-zinc-200 resize-none min-h-[75px] focus-visible:ring-emerald-500"
                disabled={isSending}
              />
            </div>
          </div>

          <DialogFooter className="mt-2 flex items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsSendOpen(false)}
              disabled={isSending}
              className="rounded-xl font-bold text-xs h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={isSending || vendorMobile.replace(/\D/g, "").length < 10}
              className="rounded-xl font-black text-xs h-10 px-5 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send on WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
}

