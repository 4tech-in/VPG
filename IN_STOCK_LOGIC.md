# In Stock Logic (Requested Items)

This document details the exact computation, business rules, and UI rendering logic for the **IN STOCK** column displayed in the **Requested Items** table during Purchase Order (PO) creation.

---

## 1. Overview & Concept

In the Purchase Order module, the **IN STOCK** badge does **not** represent a static warehouse inventory count. Instead, it dynamically calculates:

> **The sum of all pending (unconsumed / remaining on site) quantities of that material across all previous active Purchase Orders for the selected project.**

```
┌────────────────────────────────────────────────────────┐
│  IN STOCK = Σ (Pending Quantity from Previous Project POs)  │
└────────────────────────────────────────────────────────┘
```

* **Purpose:** Allows the purchasing manager to immediately see how much of the requested material is already procured/on-site before raising another PO for the same item.

---

## 2. Core Business Formulas

For any line item inside a Purchase Order:

$$\text{Total Quantity} = \text{Material Used} + \text{Pending}$$

Therefore:

$$\text{Pending Quantity} = \max(0, \text{Total Quantity} - \text{Material Used})$$

And for a requested item $I$:

$$\text{In Stock Qty}(I) = \sum_{P \in \text{Project POs}} \sum_{i \in P.\text{items},\, i \approx I} i.\text{pending}$$

Where:
* $P.\text{status} \neq \text{"Cancelled"}$
* $i \approx I$ indicates that the item matches by ID or normalized name.

---

## 3. Step-by-Step Logic Pipeline

```mermaid
flowchart TD
    A[Select Project / Load Indent] --> B[Fetch all POs for Project where status != 'Cancelled']
    B --> C[Extract and Normalize PO Items]
    C --> D[Compute Pending Quantity per PO Item]
    D --> E[For each Requested Item: Match with PO Items]
    E --> F[Sum pending quantities of matched items]
    F --> G{In Stock > 0?}
    G -- Yes --> H[Render Amber Badge: '{inStockQty} {unit}']
    G -- No --> I[Render Muted Text: '0 {unit}']
```

### Step 1: Fetch Project Purchase Orders
When a project is selected (or when creating a PO for an Indent):
1. All Purchase Orders associated with `targetProjectId` are fetched:
   ```ts
   const poRes = await purchaseOrderService.getPurchaseOrders({
     projectId: targetProjectId,
     limit: 1000
   });
   const projPOs = (poRes.data || []).filter((po) => po.status !== "Cancelled");
   ```
2. If `materialUsed` or `pending` totals are missing at the root level of a single-item PO, the system enriches them via `getPurchaseOrderById(id)`.

---

### Step 2: Extract & Compute Pending Quantity per PO Item
For every item `pi` in each Purchase Order `po`:

1. **Total Quantity:**
   ```ts
   const totalQuantity = Number(
     pi.totalQuantity ??
     pi.totalCount ??
     (po.items?.length === 1 && po.totalCount != null ? po.totalCount : null) ??
     (po.items?.length === 1 && po.totalQuantity != null ? po.totalQuantity : null) ??
     pi.indentQuantity ??
     orderQuantity
   );
   ```

2. **Material Used (Issued / Consumed):**
   ```ts
   let materialUsed = 0;
   if (po.items?.length === 1 && po.materialUsed != null && Number.isFinite(Number(po.materialUsed))) {
     materialUsed = Number(po.materialUsed);
   } else if (pi.materialUsed != null && Number.isFinite(Number(pi.materialUsed))) {
     materialUsed = Number(pi.materialUsed);
   } else if (pi.issuedToRequesterQuantity != null && Number.isFinite(Number(pi.issuedToRequesterQuantity))) {
     materialUsed = Number(pi.issuedToRequesterQuantity);
   } else if (po.items?.length === 1 && po.totalCount != null && po.pending != null) {
     materialUsed = Math.max(0, Number(po.totalCount) - Number(po.pending));
   }
   ```

3. **Pending Quantity:**
   ```ts
   let pending = 0;
   if (po.items?.length === 1 && po.pending != null && Number.isFinite(Number(po.pending))) {
     pending = Number(po.pending);
   } else if (pi.pending != null && Number.isFinite(Number(pi.pending))) {
     pending = Number(pi.pending);
   } else {
     pending = Math.max(0, totalQuantity - materialUsed);
   }

   // Consistency checks:
   if (materialUsed === 0 && pending > 0 && pending < totalQuantity) {
     materialUsed = totalQuantity - pending;
   }
   if (pending === 0 && materialUsed > 0 && materialUsed < totalQuantity) {
     pending = totalQuantity - materialUsed;
   }
   ```

Each item is then saved into `projectPOItems` list with its `itemId`, `itemName`, and computed `pending`.

---

### Step 3: Match Requested Item & Calculate Pending Stock (`getItemPendingStock`)

When rendering the requested item row, the function `getItemPendingStock(item)` resolves matching PO items:

1. **Extract Item Identifiers:**
   ```ts
   const currentItemId = String(
     item.itemId?._id ||
     item.itemId?.id ||
     (typeof item.itemId === "string" ? item.itemId : "") ||
     item._id ||
     item.id ||
     ""
   ).trim().toLowerCase();

   const currentItemName = (
     item.name ||
     item.itemName ||
     item.itemId?.name ||
     item.itemId?.itemName ||
     ""
   ).trim().toLowerCase();
   ```

2. **Matching Strategy:**
   - **Match by ID:** Checks if `poItem.itemId` equals `currentItemId` or contains each other.
   - **Fallback Match by Name:** If ID comparison does not match, compares normalized `poItem.itemName === currentItemName` (excluding generic strings like `"material..."` or `"unknown item"`).

3. **Accumulate Pending:**
   ```ts
   const matchingPOItems = projectPOItems.filter((poItem) => {
     const pId = String(poItem.itemId || "").trim().toLowerCase();
     if (
       currentItemId &&
       pId &&
       (pId === currentItemId || currentItemId.includes(pId) || pId.includes(currentItemId))
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
   ```

---

## 4. UI Display Logic

In the table column `<th class="...">In Stock</th>`:

```tsx
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
```

### Visual Representation:
| In Stock Quantity | Visual Style | Example Output |
| :--- | :--- | :--- |
| **> 0** | Amber Badge (`bg-amber-50`, `border-amber-200`, `text-amber-700`) | `150 KG` |
| **0** | Muted Grey text (`text-zinc-400 font-semibold`) | `0 KG` |

---

## 5. File Location in Codebase

* **Implementation File:** [src/app/(dashboard)/purchase-order/new/page.tsx](file:///Users/pratikjatale/Projetcs/VPG_PROD/VPG/src/app/(dashboard)/purchase-order/new/page.tsx)
  * Extraction & pending calculation: lines `431`–`548`
  * Matching & aggregation hook: `getItemPendingStock` (lines `1221`–`1269`)
  * Table Column Rendering: lines `1632`–`1646`
