import { apiRequest } from "@/lib/api-client"

export const assetMaintenanceService = {
  async getMaintenances(params?: { page?: number; limit?: number; assetId?: string; vendorId?: string; search?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`asset-maintenances${queryString ? `?${queryString}` : ""}`)
  },
  
  async getMaintenanceById(id: string): Promise<any> {
    return apiRequest<any>(`asset-maintenances/${id}`)
  }
}
