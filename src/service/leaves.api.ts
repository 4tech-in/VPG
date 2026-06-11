import { apiRequest } from "@/lib/api-client"

export type ApiLeave = {
  _id: string
  userId: any
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
  status: string
}

export const leaveService = {
  async getLeaves(params?: { page?: number; limit?: number; status?: string; userId?: string; search?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`leaves${queryString ? `?${queryString}` : ""}`)
  },

  async getLeaveById(id: string): Promise<ApiLeave> {
    return apiRequest<ApiLeave>(`leaves/${id}`)
  },

  async getMyLeaves(params?: { page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`leaves/me${queryString ? `?${queryString}` : ""}`)
  },

  async createLeave(payload: any): Promise<ApiLeave> {
    return apiRequest<ApiLeave>("leaves", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateLeaveStatus(id: string, payload: { status: string; remarks?: string; rejectionReason?: string }): Promise<ApiLeave> {
    return apiRequest<ApiLeave>(`leaves/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },
}
