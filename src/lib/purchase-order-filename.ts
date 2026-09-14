export function purchaseOrderPdfFilename(po: any): string {
  const safePart = (value: unknown) => String(value)
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^[. _]+|[. _]+$/g, "")
    .slice(0, 80);

  const number = safePart(po.poNo || po._id || po.id || "Order");
  const vendor = safePart(po.vendorName || po.vendorId?.name || "Vendor");
  return `Purchase_Order_${number}_${vendor}.pdf`;
}
