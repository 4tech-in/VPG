import { apiRequest } from "@/lib/api-client"

export type ApiVendor = {
  id?: string
  _id?: string
  vendorCode: string
  name: string
  companyName?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  panNumber?: string
  contactPerson?: string
  contactNumber: string
  alternateNumber?: string
  email?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  status: "active" | "inactive"
  itemId: string
  itemName?: string
  createdAt?: string
}

export type GetVendorsResponse = {
  vendors: ApiVendor[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateVendorPayload = {
  vendorCode: string
  name: string
  companyName?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  panNumber?: string
  contactPerson?: string
  contactNumber: string
  alternateNumber?: string
  email?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  status: "active" | "inactive"
  itemId: string
}

export const vendorService = {
  async getVendors(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    itemId?: string
  }): Promise<GetVendorsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.status) query.append("status", params.status)
    if (params?.itemId) query.append("itemId", params.itemId)

    const queryString = query.toString()
    const response = await apiRequest<any>(`vendors${queryString ? `?${queryString}` : ""}`)

    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        vendors: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      }
    } else {
      const vendors = Array.isArray(response) ? response : response?.data || []
      return {
        vendors,
        pagination: {
          page: 1,
          limit: vendors.length || 10,
          totalItems: vendors.length,
          totalPages: 1,
        },
      }
    }
  },

  async createVendor(payload: CreateVendorPayload): Promise<ApiVendor> {
    return apiRequest<ApiVendor>("vendors", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateVendor(id: string, payload: Partial<CreateVendorPayload>): Promise<ApiVendor> {
    return apiRequest<ApiVendor>(`vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteVendor(id: string): Promise<void> {
    return apiRequest(`vendors/${id}`, { method: "DELETE" })
  },

  async bulkAction(action: "block" | "soft-delete" | "export", ids: string[]): Promise<any> {
    return apiRequest<any>("vendors/bulk", {
      method: "POST",
      body: JSON.stringify({ action, ids }),
    })
  },
}
