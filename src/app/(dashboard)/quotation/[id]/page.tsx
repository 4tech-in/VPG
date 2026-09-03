"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, Send } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { indentService } from "@/service/indents.api";
import { toast } from "sonner";
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

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    setLoading(true);
    indentService.getIndentById(id)
      .then(setIndent)
      .catch((error) => toast.error(error?.message || "Unable to load quotation details"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const items = useMemo(() => (indent?.items || []).map((entry: any, index: number) => {
    const item = entry.itemId || {};
    const quantity = Number(entry.quantity || 0);
    return {
      id: item._id || index,
      code: item.itemCode || item.newItemCode || "—",
      name: item.itemName || item.name || "Unknown item",
      specification: item.specification || item.unindentSpecification || item.extraNote || "",
      quantity,
      unit: entry.unitId?.label || entry.unitId?.value || item.unitId?.label || item.unitId?.value || "Units",
    };
  }), [indent]);

  const sendToVendor = async () => {
    const projectName = indent.projectId?.projectName || indent.projectId?.name || "Project";
    const border = { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB" };
    const borders = { top: border, bottom: border, left: border, right: border };
    const cell = (text: string, width: number, options?: { header?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType] }) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 140, bottom: 140, left: 140, right: 140 },
      borders,
      shading: options?.header ? { fill: "0F766E", type: ShadingType.CLEAR, color: "auto" } : undefined,
      children: [new Paragraph({ alignment: options?.align || AlignmentType.LEFT, spacing: { before: 0, after: 0, line: 280 }, children: [new TextRun({ text, bold: Boolean(options?.header), color: options?.header ? "FFFFFF" : "1F2937", font: "Arial", size: options?.header ? 20 : 21 })] })],
    });

    const itemRows = items.map((item: any, index: number) => new TableRow({
      cantSplit: true,
      children: [
        cell(String(index + 1), 600, { align: AlignmentType.CENTER }),
        cell(`${item.name}\nCode: ${item.code}${item.specification ? `\n${item.specification}` : ""}`, 3900),
        cell(`${item.quantity} ${item.unit}`, 1200, { align: AlignmentType.CENTER }),
        cell("", 1800),
        cell("", 1860),
      ],
    }));

    const chargeRows = ["Freight Charges", "Packaging Charges", "Other Charges", "GST Percentage", "GST Amount"].map((label) => new TableRow({
      children: [cell(label, 4000), cell("", 5360)],
    }));

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Arial", size: 22, color: "1F2937" }, paragraph: { spacing: { after: 120, line: 280 } } } },
        paragraphStyles: [{ id: "QuotationTitle", name: "Quotation Title", basedOn: "Normal", next: "Normal", run: { font: "Cambria", size: 40, bold: false, color: "2F75B5" }, paragraph: { spacing: { before: 0, after: 100 }, alignment: AlignmentType.LEFT, outlineLevel: 0 } }],
      },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1440, bottom: 1080, left: 1440, header: 708, footer: 708 } } },
        headers: {},
        children: [
          new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "VPG CONSTRUCTION PRIVATE LIMITED", bold: true, color: "0F766E", font: "Arial", size: 20 })] }),
          new Paragraph({ style: "QuotationTitle", children: [new TextRun("REQUEST FOR QUOTATION")] }),
          new Paragraph({ spacing: { before: 0, after: 360 }, children: [] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1800, 7560],
            rows: [new TableRow({ children: [cell("PROJECT", 1800, { header: true }), cell(projectName, 7560)] })],
          }),
          new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "REQUESTED ITEMS", bold: true, color: "073B3A", font: "Arial", size: 24 })] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [600, 3900, 1200, 1800, 1860],
            rows: [new TableRow({ tableHeader: true, children: [cell("#", 600, { header: true, align: AlignmentType.CENTER }), cell("ITEM DETAILS", 3900, { header: true }), cell("QUANTITY", 1200, { header: true, align: AlignmentType.CENTER }), cell("UNIT PRICE", 1800, { header: true, align: AlignmentType.CENTER }), cell("TOTAL PRICE", 1860, { header: true, align: AlignmentType.CENTER })] }), ...itemRows],
          }),
          new Paragraph({ spacing: { before: 280, after: 120 }, children: [new TextRun({ text: "VENDOR CHARGES", bold: true, color: "073B3A", font: "Arial", size: 24 })] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [4000, 5360],
            rows: [new TableRow({ tableHeader: true, children: [cell("CHARGE", 4000, { header: true }), cell("VENDOR AMOUNT / RATE", 5360, { header: true })] }), ...chargeRows],
          }),
          new Paragraph({ spacing: { before: 360, after: 80 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Vendor Name: ______________________________", font: "Arial", size: 21 })] }),
          new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Authorized Signature: ______________________", font: "Arial", size: 21 })] }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const safeReference = String(indent.indentId || "quotation").replace(/[^a-z0-9_-]/gi, "-");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeReference}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast.success("Quotation DOCX downloaded. Open it to review and send to the vendor.");
    } catch (error: any) {
      console.error("Unable to generate quotation DOCX", error);
      toast.error("Unable to generate the quotation DOCX");
    }
  };

  if (loading) return <ContentLayout title="Quotation"><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div></ContentLayout>;
  if (!indent) return <ContentLayout title="Quotation"><div className="p-10 text-center font-bold text-zinc-500">Quotation details not found.</div></ContentLayout>;
  if (indent.status !== "Approved") return <ContentLayout title="Quotation"><div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center"><p className="font-bold text-zinc-600">Quotation is available only for approved indents.</p><Button variant="outline" onClick={() => router.push("/indent")}>Back to Indents</Button></div></ContentLayout>;

  return (
    <ContentLayout title={`Quotation: ${indent.indentId || "Indent"}`}>
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-7 p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-950 to-teal-700 p-6 text-white shadow-xl shadow-teal-950/10">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button>
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">Request for quotation</p><h1 className="text-2xl font-black">{indent.indentId || "Quotation"}</h1></div>
          </div>
          <Button onClick={sendToVendor} className="gap-2 bg-white font-black text-teal-800 hover:bg-teal-50"><Send className="h-4 w-4" /> Send to Vendor</Button>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-teal-600" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Project</span></div>
          <p className="text-xl font-black text-zinc-900">{indent.projectId?.projectName || indent.projectId?.name || "—"}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-7 py-5"><h2 className="text-sm font-black uppercase tracking-widest text-zinc-900">Requested Items</h2><span className="text-xs font-bold text-zinc-400">{items.length} item{items.length === 1 ? "" : "s"}</span></div>
          <div className="overflow-x-auto"><table className="w-full border-collapse text-left"><thead className="bg-zinc-50"><tr>{["#", "Item Details", "Quantity", "Unit Price", "Total Price"].map((heading) => <th key={heading} className="border-b border-zinc-200 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 last:text-right">{heading}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">
            {items.map((item: any, index: number) => <tr key={item.id} className="hover:bg-zinc-50/50"><td className="px-6 py-5 text-xs font-bold text-zinc-400">{index + 1}</td><td className="px-6 py-5"><p className="text-sm font-black text-zinc-900">{item.name}</p><p className="mt-1 text-[10px] font-bold text-zinc-400">Code: {item.code}{item.specification ? ` • ${item.specification}` : ""}</p></td><td className="px-6 py-5 text-sm font-bold text-zinc-700">{item.quantity} {item.unit}</td><td className="px-6 py-5"><span className="block h-6 w-28 border-b border-zinc-400" /></td><td className="px-6 py-5 text-right"><span className="ml-auto block h-6 w-28 border-b border-zinc-400" /></td></tr>)}
            {!items.length && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-zinc-400">No items found.</td></tr>}
          </tbody></table></div>
          <div className="border-t border-zinc-200 bg-zinc-50/60 p-7">
            <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-zinc-900">Vendor Charges</h3>
            <div className="ml-auto grid max-w-xl grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              {["Freight Charges", "Packaging Charges", "Other Charges", "GST Percentage", "GST Amount"].map((label) => (
                <div key={label} className="flex items-end justify-between gap-5">
                  <span className="whitespace-nowrap text-xs font-bold text-zinc-600">{label}</span>
                  <span className="block h-6 min-w-28 flex-1 border-b border-zinc-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
