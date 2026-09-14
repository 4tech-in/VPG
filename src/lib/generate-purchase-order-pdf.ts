import { purchaseOrderReceiptHtml } from "@/lib/export-receipt";
import { purchaseOrderPdfFilename } from "@/lib/purchase-order-filename";

// Escape record values before interpolating them into the print template.
function escapeRecord(value: any): any {
  if (typeof value === "string") return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  if (Array.isArray(value)) return value.map(escapeRecord);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, escapeRecord(entry)]));
  return value;
}

export async function generatePurchaseOrderPdf(po: any): Promise<File> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"), import("jspdf"),
  ]);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;pointer-events:none";
  try {
    const html = purchaseOrderReceiptHtml(escapeRecord(po))
      .replace(/<script>[\s\S]*?<\/script>/g, "")
      .replace(/@import[^;]+;/g, "");
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("PDF preparation timed out. Please retry.")), 20000);
      frame.onload = () => { window.clearTimeout(timeout); resolve(); };
      frame.srcdoc = html;
      document.body.appendChild(frame);
    });
    const doc = frame.contentDocument;
    if (!doc) throw new Error("Could not prepare the PDF");
    doc.querySelectorAll(".no-print").forEach((element) => element.remove());
    await Promise.all(Array.from(doc.images).map(async (img) => {
      // Same-origin branding must be fully loaded before capture.
      img.src = new URL(img.getAttribute("src") || "", window.location.origin).href;
      await img.decode();
    }));
    await doc.fonts.ready;
    // Reserve space for the signature so longer orders never clip their contents.
    const contentBottom = Math.max(...Array.from(doc.body.children)
      .filter((el) => !el.matches(".authorization-signature, .bottom-wave"))
      .map((el) => el.getBoundingClientRect().bottom));
    doc.body.style.height = `${Math.max(1123, Math.ceil(contentBottom + 230))}px`;
    doc.body.style.overflow = "visible";
    const canvas = await html2canvas(doc.body, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    // Keep the complete letterhead together, including its signature and footer.
    const width = Math.min(210, 297 * canvas.width / canvas.height);
    const height = width * canvas.height / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", (210 - width) / 2, 0, width, height);
    pdf.setProperties({ title: purchaseOrderPdfFilename(po).replace(/\.pdf$/, "") });
    return new File([pdf.output("blob")], purchaseOrderPdfFilename(po), { type: "application/pdf" });
  } finally {
    frame.remove();
  }
}

export async function generateReceiptPdf(po: any): Promise<File> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const cleanVendor = String(
    po?.vendorName || po?.vendorId?.vendorName || po?.vendorId?.name || "Vendor"
  ).replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Receipt_${po?.poNo || "Slip"}_${cleanVendor}.pdf`;

  const targetNode = typeof document !== "undefined" ? document.getElementById("material-receipt-print-area") : null;
  if (targetNode) {
    const canvas = await html2canvas(targetNode, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const pageWidth = 148;
    const pageHeight = 210;
    const margin = 6;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const pdfWidth = canvas.width * ratio;
    const pdfHeight = canvas.height * ratio;
    const x = (pageWidth - pdfWidth) / 2;
    const y = (pageHeight - pdfHeight) / 2;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, pdfWidth, pdfHeight);
    pdf.setProperties({ title: filename.replace(/\.pdf$/, "") });
    return new File([pdf.output("blob")], filename, { type: "application/pdf" });
  }

  const poFile = await generatePurchaseOrderPdf(po);
  return new File([poFile], filename, { type: "application/pdf" });
}

