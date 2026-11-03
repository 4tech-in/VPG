import { apiRequest } from "@/lib/api-client";

export type POItem = {
  itemId:
    | {
        _id: string;
        itemName?: string;
        name?: string;
      }
    | any;
  unitId:
    | {
        _id: string;
        unitName?: string;
        name?: string;
      }
    | any;
  indentQuantity: number;
  orderQuantity: number;
  rate: number;
  amount: number;
};

export type PurchaseOrder = {
  id?: string;
  _id?: string;
  poNo: string;
  purchaseOrderType?: string;
  indentId?: any;
  projectId?: any;
  requesterId?: any;
  receiverMaterial?:any;
  vendorName: string;
  vendorMobile?: string | null;
  vendorAddress?: string | null;
  vehicleNo?: string | null;
  locationAddress?: string | null;
  deliveryAddress?: string | null;
  storageLocation?: string | null;
  items: POItem[];
  totalAmount: number;
  materialUsed?: number;
  pending?: number;
  totalCount?: number;
  totalQuantity?: number;
  status:
    | "Draft"
    | "PendingApproval"
    | "Approved"
    | "Rejected"
    | "Ordered"
    | "PendingVerification"
    | "PartiallyReceived"
    | "Received"
    | "Completed"
    | "Issued"
    | "Cancelled";
  verificationStatus?: string;
  latestSlipNo?: string;
  receipts?: any[];
  createdAt?: string;
};

export type CombinedInwardEntry = {
  id: string;
  receiptId?: string;
  srNo: number;
  date: string;
  rawDate: string;
  timestamp?: number;
  vendorName: string;
  vendorId?: string;
  receiptNo: string;
  poNo: string;
  poId: string;
  projectName: string;
  projectId?: string;
  itemDescription: string;
  qty: string;
  items: Array<{ itemId?: string; name: string; qty: number | string; unit: string }>;
  vehicleNo: string;
  actualCount: string | number;
  recdBy: string;
  verificationStatus: string;
  billPhoto?: string | null;
  materialPhoto?: string | null;
  remarks?: string | null;
};

export type MaterialInwardCombinedSummary = {
  totalOrders: number;
  totalQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  totalValue: number;
  totalAmount: number;
  totalMaterial: number;
  materialUsed: number;
  materialPending: number;
  totalInwardEntries: number;
  uniqueVendors: number;
  activeProjects: number;
  filteredResults: number;
};

export type GetMaterialInwardCombinedResponse = {
  success: boolean;
  summary: MaterialInwardCombinedSummary;
  orders: PurchaseOrder[];
  purchaseOrders: PurchaseOrder[];
  inwardEntries: CombinedInwardEntry[];
  inwardRegister: CombinedInwardEntry[];
  usageHistory?: any[];
  totalOrders: number;
  totalQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  totalValue: number;
  totalAmount?: number;
  totalMaterial: number;
  materialUsed: number;
  materialPending: number;
  totalInwardEntries: number;
  uniqueVendors: number;
  activeProjects: number;
  filteredResults: number;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data?: {
    summary: MaterialInwardCombinedSummary;
    orders: PurchaseOrder[];
    inwardEntries: CombinedInwardEntry[];
    usageHistory?: any[];
  };
};

export type GetPOsResponse = {
  success: boolean;
  data: PurchaseOrder[];
  total: number;
  page: number;
  totalPages: number;
  totalOrders?: number;
  totalItems?: number;
  totalQuantity?: number;
  totalValue?: number;
  totalAmount?: number;
  pendingQuantity?: number;
  totalPendingQuantity?: number;
  receivedQuantity?: number;
  totalReceivedQuantity?: number;
};

export const purchaseOrderService = {
  async getMaterialInwardCombined(
    params?: Record<string, any>
  ): Promise<GetMaterialInwardCombinedResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    const response = await apiRequest<any>(
      `purchase-orders/material-inward-combined${queryString ? `?${queryString}` : ""}`
    );
    return response?.data && response?.orders
      ? response
      : {
          success: response?.success ?? true,
          summary: response?.summary || response?.data?.summary || {
            totalOrders: 0,
            totalQuantity: 0,
            receivedQuantity: 0,
            pendingQuantity: 0,
            totalValue: 0,
            totalAmount: 0,
            totalMaterial: 0,
            materialUsed: 0,
            materialPending: 0,
            totalInwardEntries: 0,
            uniqueVendors: 0,
            activeProjects: 0,
            filteredResults: 0,
          },
          orders: response?.orders || response?.data?.orders || response?.data || [],
          purchaseOrders: response?.purchaseOrders || response?.orders || response?.data?.orders || response?.data || [],
          inwardEntries: response?.inwardEntries || response?.data?.inwardEntries || [],
          inwardRegister: response?.inwardRegister || response?.inwardEntries || response?.data?.inwardEntries || [],
          usageHistory: response?.usageHistory || response?.data?.usageHistory || [],
          totalOrders: Number(response?.totalOrders ?? response?.summary?.totalOrders ?? 0),
          totalQuantity: Number(response?.totalQuantity ?? response?.summary?.totalQuantity ?? 0),
          receivedQuantity: Number(response?.receivedQuantity ?? response?.summary?.receivedQuantity ?? 0),
          pendingQuantity: Number(response?.pendingQuantity ?? response?.summary?.pendingQuantity ?? 0),
          totalValue: Number(response?.totalValue ?? response?.summary?.totalValue ?? 0),
          totalMaterial: Number(response?.totalMaterial ?? response?.summary?.totalMaterial ?? 0),
          materialUsed: Number(response?.materialUsed ?? response?.summary?.materialUsed ?? 0),
          materialPending: Number(response?.materialPending ?? response?.summary?.materialPending ?? 0),
          totalInwardEntries: Number(response?.totalInwardEntries ?? response?.summary?.totalInwardEntries ?? 0),
          uniqueVendors: Number(response?.uniqueVendors ?? response?.summary?.uniqueVendors ?? 0),
          activeProjects: Number(response?.activeProjects ?? response?.summary?.activeProjects ?? 0),
          filteredResults: Number(response?.filteredResults ?? response?.summary?.filteredResults ?? 0),
          count: Number(response?.count ?? response?.orders?.length ?? 0),
          total: Number(response?.total ?? response?.summary?.totalOrders ?? 0),
          page: Number(response?.page ?? 1),
          totalPages: Number(response?.totalPages ?? 1),
        };
  },
  async getPurchaseOrders(
    params?: Record<string, any>,
  ): Promise<GetPOsResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    const queryString = query.toString();
    const response = await apiRequest<any>(
      `purchase-orders${queryString ? `?${queryString}` : ""}`,
    );

    const pos = Array.isArray(response) ? response : response?.data || [];
    return {
      success: true,
      data: pos,
      total: Number(response?.total ?? pos.length),
      page: Number(response?.page ?? params?.page ?? 1),
      totalPages: Number(response?.totalPages ?? 1),
      totalOrders: response?.totalOrders,
      totalItems: response?.totalItems,
      totalQuantity: response?.totalQuantity,
      totalValue: response?.totalValue,
      totalAmount: response?.totalAmount,
      pendingQuantity: response?.pendingQuantity,
      totalPendingQuantity: response?.totalPendingQuantity,
      receivedQuantity: response?.receivedQuantity,
      totalReceivedQuantity: response?.totalReceivedQuantity,
    };
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/${id}`);
    return response?.data || response;
  },

  async createPurchaseOrder(payload: any): Promise<PurchaseOrder> {
    const hasImages = payload.images && Array.isArray(payload.images) && payload.images.length > 0;
    let body: any;
    let isFormData = false;

    if (hasImages) {
      isFormData = true;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === "images") {
          payload.images.forEach((file: File) => {
            formData.append("images", file);
          });
        } else if (key === "items") {
          formData.append("items", typeof val === "string" ? val : JSON.stringify(val));
        } else if (val !== null && val !== undefined) {
          formData.append(key, String(val));
        }
      });
      body = formData;
    } else {
      body = JSON.stringify(payload);
    }

    const response = await apiRequest<any>("purchase-orders", {
      method: "POST",
      body,
      isFormData,
    });
    return response?.data || response;
  },

  async approvePurchaseOrder(
    id: string,
    payload: { status: "Approved" | "Rejected"; rejectionReason?: string },
  ): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/approve/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response?.data || response;
  },

  async markPurchaseOrderOrdered(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/ordered/${id}`, {
      method: "PATCH",
    });
    return response?.data || response;
  },

  async receivePurchaseOrderMaterial(
    id: string,
    payload: { items: { itemId: string; receivedQuantity: number }[] },
  ): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/receive/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response?.data || response;
  },

  async submitGoodsReceipt(id: string, payload: any): Promise<any> {
    const hasImages = (payload.billPhoto && payload.billPhoto instanceof File) || 
                      (payload.materialPhoto && payload.materialPhoto instanceof File);
    
    let body: any;
    let isFormData = false;

    if (hasImages) {
      isFormData = true;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === "items") {
          formData.append("items", typeof val === "string" ? val : JSON.stringify(val));
        } else if (val !== null && val !== undefined) {
          formData.append(key, val as any);
        }
      });
      body = formData;
    } else {
      body = JSON.stringify(payload);
    }

    const response = await apiRequest<any>(`purchase-orders/receipt/${id}`, {
      method: "POST",
      body,
      isFormData,
    });
    return response?.data || response;
  },

  async issueMaterialToRequester(
    id: string,
    payload: { items: { itemId: string; supplyQuantity: number }[] },
  ): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/issue/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response?.data || response;
  },

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/cancel/${id}`, {
      method: "PATCH",
    });
    return response?.data || response;
  },

  async completePurchaseOrder(
    id: string,
    payload: { remark?: string; closeIndent: boolean }
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const body: any = {
      closeIndent: payload.closeIndent,
    };
    if (payload.remark && payload.remark.trim()) {
      body.remark = payload.remark.trim();
    }
    const response = await apiRequest<any>(`purchase-orders/complete/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return response;
  },

  async bulkAction(action: "block" | "soft-delete" | "export", ids: string[]): Promise<any> {
    return apiRequest<any>("purchase-orders/bulk", {
      method: "POST",
      body: JSON.stringify({ action, ids }),
    });
  },

  async getPendingVerifications(): Promise<GetPOsResponse> {
    const response = await apiRequest<any>("purchase-orders/pending-verification");
    const pos = Array.isArray(response) ? response : response?.data || [];
    return {
      success: true,
      data: pos,
      total: pos.length,
      page: 1,
      totalPages: 1,
    };
  },

  async verifyPurchaseOrderReceipt(
    id: string,
    payload: { action: "APPROVED" | "REMAINING" | "REJECTED"; remark?: string; receiptId?: string }
  ): Promise<any> {
    const response = await apiRequest<any>(`purchase-orders/verify/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response?.data || response;
  },

  async sendPurchaseOrderWhatsApp(
    id: string,
    options?: { phone?: string; pdfUrl?: string; message?: string; pdf?: File }
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    if (options?.phone) formData.append("phone", options.phone);
    if (options?.message) formData.append("message", options.message);
    if (options?.pdf) formData.append("pdf", options.pdf, options.pdf.name);
    if (options?.pdfUrl !== undefined) formData.append("pdfUrl", options.pdfUrl);
    const response = await apiRequest<any>(`purchase-orders/send-whatsapp/${id}`, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
    return response?.data || response;
  },
};
