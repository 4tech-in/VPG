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
        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #000;">${item.itemId?.itemName || item.itemId?.name || "Unknown Item"}</td>
        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${item.size || "-"}</td>
        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${item.orderQuantity || item.indentQuantity}</td>
        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${Number(item.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #000; text-align: right;">${Number(item.amount || ((item.orderQuantity || item.indentQuantity) * (item.rate || 0))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    `
    )
    .join("");

  const itemsSubtotal = (po.items || []).reduce((acc: number, item: any) => {
    return acc + Number(item.amount || ((item.orderQuantity || item.indentQuantity) * (item.rate || 0)))
  }, 0);

  const gstAmount = Number(po.gst || 0);
  const grandTotal = Number(po.totalAmount || (itemsSubtotal + gstAmount));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order - ${po.poNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cambria:wght@400;700&display=swap');
          @page {
            size: A4;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Cambria', 'Times New Roman', serif;
            color: #000;
            background: #ffffff;
            margin: 0;
            padding: 40px 40px 20px 40px;
            font-size: 12px;
            line-height: 1.4;
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-container {
            text-align: left;
            width: 200px;
          }
          .logo-container img {
            max-width: 140px;
            mix-blend-mode: multiply;
            filter: contrast(1.2) brightness(1.05);
            border: none;
            outline: none;
            margin-left: -5px;
          }
          .contact-block {
            display: flex;
            align-items: stretch;
          }
          .contact-info {
            text-align: right;
            font-size: 10px;
            line-height: 1.5;
            font-family: Arial, sans-serif;
            margin-right: 10px;
            font-weight: bold;
          }
          .contact-info-row {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-bottom: 3px;
          }
          .contact-info-row svg {
            width: 10px;
            height: 10px;
            margin-right: 6px;
          }
          .color-bar {
            width: 30px;
            display: flex;
          }
          .color-bar-light {
            width: 10px;
            background-color: #00b4d8;
          }
          .color-bar-dark {
            width: 20px;
            background-color: #1b1b42;
          }
          .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0 15px 0;
            font-family: 'Times New Roman', serif;
          }
          .po-details {
            margin-bottom: 15px;
            font-size: 12px;
          }
          .po-details div {
            margin-bottom: 2px;
          }
          .vendor-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
            border: 1px solid #000;
            border-bottom: none;
            position: relative;
            z-index: 1;
            background-color: #ffffff;
          }
          .vendor-table th {
            background-color: #000;
            color: #fff;
            padding: 4px 8px;
            text-align: left;
            font-size: 11px;
            border: 1px solid #000;
            font-family: Arial, sans-serif;
            font-weight: bold;
          }
          .vendor-table td {
            padding: 4px 8px;
            border: 1px solid #000;
            font-size: 11px;
            font-family: 'Times New Roman', serif;
          }
          .vendor-table tr:last-child td {
            border-bottom: none;
          }
          .vendor-table .grey-row td {
            background-color: #e6e6e6;
            font-weight: bold;
          }
          
          .items-table-container {
            position: relative;
            min-height: 250px;
          }
          
          .watermark {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.08;
            z-index: 0;
            width: 600px;
            pointer-events: none;
            mix-blend-mode: multiply;
            filter: contrast(1.2) brightness(1.05);
            clip-path: inset(0 0 35% 0);
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            position: relative;
            z-index: 1;
            background: transparent;
            margin-bottom: 20px;
          }
          .items-table th {
            background-color: #e6e6e6;
            color: #000;
            padding: 6px 8px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #000;
            text-align: center;
          }
          .items-table td {
            padding: 6px 8px;
            border: 1px solid #000;
            font-size: 11px;
            text-align: center;
          }
          .items-table td:nth-child(2) {
            text-align: left;
          }
          .items-table .totals-row td {
            text-align: center;
          }
          
          .conditions {
            margin-top: 20px;
            font-size: 12px;
          }
          .conditions-title {
            margin-bottom: 8px;
          }
          .conditions-list {
            margin: 0;
            padding-left: 20px;
          }
          .conditions-list li {
            margin-bottom: 4px;
          }

          .print-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #000;
            color: #fff;
            border: none;
            padding: 10px 20px;
            font-size: 12px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 1000;
          }

          .bottom-wave {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 100%;
            height: 150px;
            z-index: -1;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt / PDF</button>

        <div class="header-container">
          <div class="logo-container">
            <img src="/vpg.jpeg" alt="VPG Logo" />
          </div>
          <div class="contact-block">
            <div class="contact-info">
              <div class="contact-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                +91 9888889139, +91 9872307900
              </div>
              <div class="contact-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                admin@vpgconstruction.co.in
              </div>
              <div class="contact-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                SCO 27, Kalgidhar Enclave, Baltana(Pb.)
              </div>
              <div class="contact-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                www.vpgconstruction.co.in
              </div>
            </div>
            <div class="color-bar">
              <div class="color-bar-light"></div>
              <div class="color-bar-dark"></div>
            </div>
          </div>
        </div>

        <div class="title">PURCHASE ORDER</div>

        <div class="po-details">
          <div>PO Number: ${po.poNo || ""}</div>
          <div>Dated: ${formattedCreated}</div>
          <div>Quotation No.: ${po.quotationNo || ""}</div>
        </div>

        <table class="vendor-table">
          <thead>
            <tr>
              <th style="width: 50%;">VENDOR</th>
              <th style="width: 50%;">DELIVERY TO</th>
            </tr>
          </thead>
          <tbody>
            <tr class="grey-row">
              <td>NAME</td>
              <td>NAME</td>
            </tr>
            <tr>
              <td>${po.vendorName || ""}</td>
              <td>VPG CONSTRUCTION PVT. LTD.</td>
            </tr>
            <tr class="grey-row">
              <td>COMPANY NAME</td>
              <td>COMPANY NAME</td>
            </tr>
            <tr>
              <td>${po.vendorCompany || ""}</td>
              <td>VPG CONSTRUCTION PVT. LTD.</td>
            </tr>
            <tr class="grey-row">
              <td>ADDRESS</td>
              <td>ADDRESS</td>
            </tr>
            <tr>
              <td>${po.vendorAddress || ""}</td>
              <td>VPG CONSTRUCTION PVT. LTD. SITE AT ${po.projectId?.projectName || po.projectId?.name || "DAPPAR"}</td>
            </tr>
            <tr class="grey-row">
              <td>GST NO: - ${po.vendorGst || ""}</td>
              <td>GST NO: -03AAWCS2873A1ZB</td>
            </tr>
          </tbody>
        </table>

        <div class="items-table-container">
          <!-- Watermark Logo -->
          <img src="/vpg.jpeg" class="watermark" alt="watermark" />
          
          <table class="items-table">
            <thead>
              <tr >
                <th style="width: 40px;">SR</th>
                <th style="text-align: left;">DESCRIPTION</th>
                <th style="width: 80px;">SIZE</th>
                <th style="width: 80px;">QTY(SQFT)</th>
                <th style="width: 80px;">RATE</th>
                <th style="width: 100px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <!-- Empty rows to fill space as in image -->
              <tr><td style="height: 22px;"></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td style="height: 22px;"></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td style="height: 22px;"></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td style="height: 22px;"></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr class="totals-row">
                <td colspan="4" style="border: none;"></td>
                <td style="border: 1px solid #000; border-left: 1px solid #000;">Subtotal</td>
                <td style="border: 1px solid #000;">${itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="totals-row">
                <td colspan="4" style="border: none;"></td>
                <td style="border: 1px solid #000; border-left: 1px solid #000;">GST 18%</td>
                <td style="border: 1px solid #000;">${gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="totals-row">
                <td colspan="4" style="border: none;"></td>
                <td style="border: 1px solid #000; border-left: 1px solid #000; font-weight: bold;">G. Total</td>
                <td style="border: 1px solid #000; font-weight: bold;">${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="conditions">
          <div class="conditions-title">Conditions:</div>
          <ol class="conditions-list">
            <li>All material is PRM quality.</li>
            <li>Payment 100% advance.</li>
            <li>Unloading on Client Scope.</li>
            <li>Rates are FOR at site ${po.projectId?.projectName || po.projectId?.name || "Dappar"}.</li>
          </ol>
        </div>

        <div class="bottom-wave">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 100%;">
            <path fill="#00b4d8" d="M0,82 Q 50,97 100,15 L 100,100 L 0,100 Z" />
            <path fill="#1a1543" d="M0,82 Q 50,97 100,25 L 100,100 L 0,100 Z" />
          </svg>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
