export function exportIndentReceipt(indent: any) {
  if (!indent) return;

  const formattedCreated = indent.createdAt ? new Date(indent.createdAt).toLocaleDateString("en-IN") : "N/A";
  const formattedDelivery = indent.estimateDeliveryDate ? new Date(indent.estimateDeliveryDate).toLocaleDateString("en-IN") : "N/A";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export the receipt.");
    return;
  }

  const itemsHtml = (indent.items || [])
    .map(
      (item: any, index: number) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: bold;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">
          <div style="font-weight: bold; color: #18181b;">${item.itemId?.itemName || item.itemId?.name || "Unknown Item"}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: bold; color: #18181b;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: left; font-weight: 500; color: #71717a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">${item.unitId?.unitName || item.unitId?.name || "Units"}</td>
      </tr>
    `
    )
    .join("");

  const statusLabel = indent.status === "Pending" ? "PENDING MANAGER" :
                      indent.status === "Approved" ? "APPROVED / PENDING PO" :
                      indent.status === "ConvertedToPO" ? "PO CREATED" : "REJECTED";

  const statusColor = indent.status === "Pending" ? "#d97706" :
                      indent.status === "Approved" ? "#2563eb" :
                      indent.status === "ConvertedToPO" ? "#059669" : "#dc2626";

  const statusBg = indent.status === "Pending" ? "#fef3c7" :
                    indent.status === "Approved" ? "#dbeafe" :
                    indent.status === "ConvertedToPO" ? "#d1fae5" : "#fee2e2";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Indent Requisition Receipt - #${indent.indentId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #18181b;
            background: #ffffff;
            margin: 0;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #18181b;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.03em;
            text-transform: uppercase;
            color: #18181b;
          }
          .subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-top: 4px;
          }
          .badge {
            display: inline-block;
            padding: 6px 16px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-radius: 9999px;
            background-color: ${statusBg};
            color: ${statusColor};
          }
          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .section-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a1a1aa;
            border-bottom: 1px solid #f4f4f5;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            color: #71717a;
            font-weight: 500;
          }
          .info-val {
            font-weight: 700;
            color: #18181b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 50px;
          }
          th {
            background-color: #f4f4f5;
            color: #27272a;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 12px;
            border-bottom: 2px solid #e4e4e7;
          }
          .footer-signs {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          .sign-box {
            width: 200px;
            text-align: center;
          }
          .sign-line {
            border-top: 1.5px solid #a1a1aa;
            margin-top: 40px;
            padding-top: 8px;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #71717a;
          }
          .print-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #18181b;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            font-weight: 800;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
          }
          .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            background: #27272a;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt / PDF</button>

        <div class="header-container">
          <div>
            <div class="logo-text">VPG Requisition</div>
            <div class="subtitle">Material Indent Request Form</div>
          </div>
          <div>
            <div class="badge">${statusLabel}</div>
          </div>
        </div>

        <div class="grid-info">
          <div>
            <div class="section-title">Request Information</div>
            <div class="info-row">
              <span class="info-label">Indent ID</span>
              <span class="info-val">#${indent.indentId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Submitted On</span>
              <span class="info-val">${formattedCreated}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Est. Delivery</span>
              <span class="info-val">${formattedDelivery}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Storage Remark</span>
              <span class="info-val">${indent.storageLocation || "Site Room"}</span>
            </div>
          </div>

          <div>
            <div class="section-title">Project & Requester</div>
            <div class="info-row">
              <span class="info-label">Project</span>
              <span class="info-val">${indent.projectId?.projectName || indent.projectId?.name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tower / Area</span>
              <span class="info-val">${indent.towerId?.towerName || indent.towerId?.name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Submitted By</span>
              <span class="info-val">${indent.requestedBy?.name || "Unknown"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Email</span>
              <span class="info-val">${indent.requestedBy?.email || "N/A"}</span>
            </div>
          </div>
        </div>

        ${
          indent.rejectionReason
            ? `
          <div style="background-color: #fee2e2; border: 1px dashed #fca5a5; padding: 16px; border-radius: 12px; margin-bottom: 30px;">
            <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: #dc2626; margin-bottom: 4px; letter-spacing: 0.05em;">Rejection Reason</div>
            <div style="font-weight: 600; color: #991b1b; font-style: italic;">"${indent.rejectionReason}"</div>
          </div>
        `
            : ""
        }

        <div class="section-title">Requested Items</div>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">No.</th>
              <th style="text-align: left;">Item Description</th>
              <th style="text-align: right; width: 120px;">Quantity</th>
              <th style="text-align: left; width: 100px; padding-left: 20px;">Unit</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="footer-signs">
          <div class="sign-box">
            <div class="sign-line">Requested By</div>
          </div>
          <div class="sign-box">
            <div class="sign-line">Verified By (Store Jr)</div>
          </div>
          <div class="sign-box">
            <div class="sign-line">Approved By (Manager)</div>
          </div>
        </div>

        <script>
          // Automatically prompt print dialog when opened
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function exportPurchaseOrderReceipt(po: any) {
  if (!po) return;

  const formattedCreated = po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN") : "N/A";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export the receipt.");
    return;
  }

  const itemsHtml = (po.items || [])
    .map(
      (item: any, index: number) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: bold;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">
          <div style="font-weight: bold; color: #18181b;">${item.itemId?.itemName || item.itemId?.name || "Unknown Item"}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: bold; color: #18181b;">${item.orderQuantity || item.indentQuantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: bold; color: #18181b;">₹${Number(item.rate || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: bold; color: #059669;">₹${Number(item.amount || ((item.orderQuantity || item.indentQuantity) * (item.rate || 0))).toLocaleString("en-IN")}</td>
      </tr>
    `
    )
    .join("");

  const itemsSubtotal = (po.items || []).reduce((acc: number, item: any) => {
    return acc + Number(item.amount || ((item.orderQuantity || item.indentQuantity) * (item.rate || 0)))
  }, 0);

  const gstAmount = Number(po.gst || 0);
  const freightCharges = Number(po.freightCharges || 0);
  const packagingCharges = Number(po.packagingCharges || 0);
  const otherCharges = Number(po.otherCharges || 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order - ${po.poNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #18181b;
            background: #ffffff;
            margin: 0;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #18181b;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.03em;
            text-transform: uppercase;
            color: #18181b;
          }
          .subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-top: 4px;
          }
          .badge {
            display: inline-block;
            padding: 6px 16px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-radius: 9999px;
            background-color: #dbeafe;
            color: #2563eb;
          }
          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .section-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a1a1aa;
            border-bottom: 1px solid #f4f4f5;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            color: #71717a;
            font-weight: 500;
          }
          .info-val {
            font-weight: 700;
            color: #18181b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f4f4f5;
            color: #27272a;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 12px;
            border-bottom: 2px solid #e4e4e7;
          }
          .total-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 50px;
          }
          .total-box {
            width: 250px;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 16px;
            background: #fafafa;
          }
          .footer-signs {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          .sign-box {
            width: 200px;
            text-align: center;
          }
          .sign-line {
            border-top: 1.5px solid #a1a1aa;
            margin-top: 40px;
            padding-top: 8px;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #71717a;
          }
          .print-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #18181b;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            font-weight: 800;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
          }
          .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            background: #27272a;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt / PDF</button>

        <div class="header-container">
          <div>
            <div class="logo-text">VPG Purchase Order</div>
            <div class="subtitle">Material Procurement Document</div>
          </div>
          <div>
            <div class="badge">${po.status || "Approved"}</div>
          </div>
        </div>

        <div class="grid-info">
          <div>
            <div class="section-title">Order Information</div>
            <div class="info-row">
              <span class="info-label">PO Number</span>
              <span class="info-val">#${po.poNo}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Date</span>
              <span class="info-val">${formattedCreated}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Indent Ref</span>
              <span class="info-val">${po.indentId?.indentId || po.indentId?.indentNo || "N/A"}</span>
            </div>
          </div>

          <div>
            <div class="section-title">Vendor & Project</div>
            <div class="info-row">
              <span class="info-label">Vendor Name</span>
              <span class="info-val">${po.vendorName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Mobile</span>
              <span class="info-val">${po.vendorMobile || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Project</span>
              <span class="info-val">${po.projectId?.projectName || po.projectId?.name || "N/A"}</span>
            </div>
          </div>
        </div>

        <div class="section-title">Ordered Items</div>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">No.</th>
              <th style="text-align: left;">Item Description</th>
              <th style="text-align: center; width: 120px;">Quantity</th>
              <th style="text-align: right; width: 120px;">Rate</th>
              <th style="text-align: right; width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-container">
          <div class="total-box">
            <div class="info-row">
              <span class="info-label">Items Subtotal</span>
              <span class="info-val">₹${itemsSubtotal.toLocaleString("en-IN")}</span>
            </div>
            <div class="info-row">
              <span class="info-label">GST / Taxes</span>
              <span class="info-val">₹${gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Freight Charges</span>
              <span class="info-val">₹${freightCharges.toLocaleString("en-IN")}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Packaging Charges</span>
              <span class="info-val">₹${packagingCharges.toLocaleString("en-IN")}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Other Charges</span>
              <span class="info-val">₹${otherCharges.toLocaleString("en-IN")}</span>
            </div>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 12px 0;" />
            <div class="info-row" style="margin-bottom: 0; font-size: 15px; font-weight: 800;">
              <span>Grand Total:</span>
              <span style="color: #059669;">₹${Number(po.totalAmount || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div class="footer-signs">
          <div class="sign-box">
            <div class="sign-line">Prepared By</div>
          </div>
          <div class="sign-box">
            <div class="sign-line">Authorized Signatory</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
