import { apiRequest } from "@/lib/api-client"

export type ApiDevice = {
  _id: string
  deviceId: string
  deviceName: string
  deviceType?: string
  status: string
  assignedTo?: any
}

export const deviceService = {
  async getDevices(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`/devices${queryString ? `?${queryString}` : ""}`)
  },

  async getDeviceById(id: string): Promise<ApiDevice> {
    return apiRequest<ApiDevice>(`/devices/${id}`)
  },

  async createDevice(payload: any): Promise<ApiDevice> {
    return apiRequest<ApiDevice>("/devices", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateDevice(id: string, payload: any): Promise<ApiDevice> {
    return apiRequest<ApiDevice>(`/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteDevice(id: string): Promise<void> {
    return apiRequest(`/devices/${id}`, { method: "DELETE" })
  },
}
