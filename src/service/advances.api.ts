import { apiRequest } from "@/lib/api-client"

export type ApiAdvance = {
  _id: string
  userId: any
  amount: number
  reason: string
  requestDate: string
  status: string
}

export const advanceService = {
  async getAdvances(params?: { page?: number; limit?: number; status?: string; userId?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`/advances${queryString ? `?${queryString}` : ""}`)
  },

  async getAdvanceById(id: string): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>(`/advances/${id}`)
  },

  async getMyAdvances(params?: { page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`/advances/me${queryString ? `?${queryString}` : ""}`)
  },

  async createAdvance(payload: any): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>("/advances", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateAdvanceStatus(id: string, payload: { status: string; remarks?: string }): Promise<ApiAdvance> {
    return apiRequest<ApiAdvance>(`/advances/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },
}
