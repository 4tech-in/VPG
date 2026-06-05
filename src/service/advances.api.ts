import { apiRequest } from "@/lib/api-client"

export type ApiAdvance = {
  _id: string
  userId: any
  amount: number
  reason: string
  advanceDate: string
  status: string
  note?: string
}

export const advanceService = {
  async getAdvances(params?: { page?: number; limit?: number; status?: string; userId?: string; search?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`advances${queryString ? `?${queryString}` : ""}`)
  },

  async getAdvanceById(id: string): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>(`advances/${id}`)
  },

  async getMyAdvances(params?: { page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`advances/my${queryString ? `?${queryString}` : ""}`)
  },

  async createAdvance(payload: any): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>("advances", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateAdvance(id: string, payload: any): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>(`advances/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async settleAdvance(id: string): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>(`advances/${id}/settle`, {
      method: "PATCH",
    })
  },

  async cancelAdvance(id: string): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>(`advances/${id}/cancel`, {
      method: "PATCH",
    })
  },

  async deleteAdvance(id: string): Promise<void> {
    return apiRequest<void>(`advances/${id}`, {
      method: "DELETE",
    })
  },
}
