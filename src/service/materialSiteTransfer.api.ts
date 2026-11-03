import { apiRequest } from "@/lib/api-client"

export interface CreateMaterialTransferPayload {
  fromProjectId: string
  toProjectId?: string
  destinationType: "site" | "vendor"
  vendorId?: string
  recipientUserId?: string
  materialId: string
  quantity: number
  fromLocation?: string
  toLocation?: string
  notes?: string
}

export const materialSiteTransferService = {
  async getTransfers(params?: {
    page?: number
    limit?: number
    fromProjectId?: string
    toProjectId?: string
    materialId?: string
    vendorId?: string
    search?: string
  }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value))
        }
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`material-site-transfers${queryString ? `?${queryString}` : ""}`)
  },

  async getTransferById(id: string): Promise<any> {
    return apiRequest<any>(`material-site-transfers/${id}`)
  },

  async createTransfer(payload: CreateMaterialTransferPayload): Promise<any> {
    return apiRequest<any>("material-site-transfers", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateTransfer(id: string, data: any): Promise<any> {
    return apiRequest<any>(`material-site-transfers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  async approveTransfer(id: string): Promise<any> {
    return this.updateTransfer(id, { status: "Approved" })
  },

  async rejectTransfer(id: string, rejectReason?: string): Promise<any> {
    return this.updateTransfer(id, {
      status: "Rejected",
      ...(rejectReason ? { rejectReason } : {}),
    })
  },

  async confirmReceipt(id: string): Promise<any> {
    return apiRequest<any>(`material-site-transfers/${id}/confirm-receipt`, {
      method: "POST",
    })
  },

  async deleteTransfer(id: string): Promise<any> {
    return apiRequest<any>(`material-site-transfers/${id}`, {
      method: "DELETE",
    })
  },

  async getTransferHistory(id: string): Promise<any> {
    return apiRequest<any>(`material-site-transfers/${id}/history`)
  },
}
