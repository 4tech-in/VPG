import { apiRequest } from "@/lib/api-client"

export type ApiDevice = {
  _id: string
  deviceId: string
  deviceName: string
  deviceType?: string
  status?: string
  assignedTo?: any
  userId?: any
  deviceModel?: string
  platform?: string
  osVersion?: string
  appVersion?: string
  lastLoginAt?: string
}

export const deviceService = {
  async getDevices(params?: { page?: number; limit?: number; search?: string; status?: string; userId?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`devices${queryString ? `?${queryString}` : ""}`)
  },

  async getDeviceById(id: string): Promise<ApiDevice> {
    return apiRequest<ApiDevice>(`devices/${id}`)
  },

  async createDevice(payload: any): Promise<ApiDevice> {
    return apiRequest<ApiDevice>("devices/create", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateDevice(userId: string, payload: any): Promise<ApiDevice> {
    return apiRequest<ApiDevice>(`devices/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async resetDevice(userId?: string): Promise<{ success: boolean; message: string }> {
    if (userId) {
      return apiRequest<{ success: boolean; message: string }>(`devices/${userId}/reset`, {
        method: "POST",
      })
    }
    return apiRequest<{ success: boolean; message: string }>("devices/reset", {
      method: "POST",
    })
  },

  async deleteDevice(userId: string): Promise<void> {
    return apiRequest(`devices/${userId}/reset`, { method: "DELETE" })
  },
}
