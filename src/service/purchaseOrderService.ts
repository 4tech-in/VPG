import { apiRequest } from "@/lib/api-client"

export type POItem = {
  itemId: {
    _id: string
    itemName?: string
    name?: string
  } | any
  unitId: {
    _id: string
    unitName?: string
    name?: string
  } | any
  indentQuantity: number
  orderQuantity: number
  rate: number
  amount: number
}

export type PurchaseOrder = {
  id?: string
  _id?: string
  poNo: string
  indentId?: any
  projectId?: any
  requesterId?: any
  vendorName: string
  vendorMobile?: string | null
  vendorAddress?: string | null
  items: POItem[]
  totalAmount: number
  status:
    | "Draft"
    | "PendingApproval"
    | "Approved"
    | "Rejected"
    | "Ordered"
    | "PartiallyReceived"
    | "Received"
    | "Issued"
    | "Cancelled"
  createdAt?: string
}

export type GetPOsResponse = {
  success: boolean
  data: PurchaseOrder[]
  total: number
  page: number
  totalPages: number
}

export const purchaseOrderService = {
  async getPurchaseOrders(params?: Record<string, any>): Promise<GetPOsResponse> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    const response = await apiRequest<any>(`purchase-orders${queryString ? `?${queryString}` : ""}`)
    
    const pos = Array.isArray(response) ? response : (response?.data || [])
    return {
      success: true,
      data: pos,
      total: pos.length,
      page: 1,
      totalPages: 1,
    }
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/${id}`)
    return response?.data || response
  },

  async createPurchaseOrder(payload: any): Promise<PurchaseOrder> {
    const response = await apiRequest<any>("purchase-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response?.data || response
  },

  async approvePurchaseOrder(id: string, payload: { status: "Approved" | "Rejected"; rejectionReason?: string }): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/approve/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return response?.data || response
  },

  async markPurchaseOrderOrdered(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/ordered/${id}`, {
      method: "PATCH",
    })
    return response?.data || response
  },

  async receivePurchaseOrderMaterial(id: string, payload: { items: { itemId: string; receivedQuantity: number }[] }): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/receive/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return response?.data || response
  },

  async issueMaterialToRequester(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/issue/${id}`, {
      method: "PATCH",
    })
    return response?.data || response
  },

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const response = await apiRequest<any>(`purchase-orders/cancel/${id}`, {
      method: "PATCH",
    })
    return response?.data || response
  },
}
