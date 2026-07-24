import { apiRequest } from "@/lib/api-client"

export const assetSiteTransferService = {
  async getTransfers(params?: { page?: number; limit?: number; fromProjectId?: string; toProjectId?: string; assetId?: string; search?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`asset-site-transfers${queryString ? `?${queryString}` : ""}`)
  },
  
  async getTransferById(id: string): Promise<any> {
    return apiRequest<any>(`asset-site-transfers/${id}`)
  },

  async updateTransfer(id: string, data: any): Promise<any> {
    return apiRequest<any>(`asset-site-transfers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async approveTransfer(id: string): Promise<any> {
    return this.updateTransfer(id, { status: "Approved" })
  },

  async rejectTransfer(id: string): Promise<any> {
    return this.updateTransfer(id, { status: "Rejected" })
  }
}
