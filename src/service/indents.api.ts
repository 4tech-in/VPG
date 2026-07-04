import { apiRequest } from "@/lib/api-client"

export type ApiIndent = {
  _id: string
  indentNo: string
  projectId: any
  towerId?: any
  status: string
  items: any[]
}

export const indentService = {
  async getIndents(params?: { page?: number; limit?: number; search?: string; status?: string; projectId?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`indents${queryString ? `?${queryString}` : ""}`)
  },

  async getIndentById(id: string): Promise<ApiIndent> {
    return apiRequest<ApiIndent>(`indents/${id}`)
  },

  async createIndent(payload: any): Promise<ApiIndent> {
    const isFormData = payload instanceof FormData;
    return apiRequest<ApiIndent>("indents", {
      method: "POST",
      body: isFormData ? payload : JSON.stringify(payload),
      isFormData,
    })
  },

  async updateIndent(id: string, payload: any): Promise<ApiIndent> {
    return apiRequest<ApiIndent>(`indents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async updateIndentStatus(id: string, payload: { status: string; rejectionReason?: string }): Promise<ApiIndent> {
    return apiRequest<ApiIndent>(`indents/status/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteIndent(id: string): Promise<void> {
    return apiRequest(`indents/${id}`, { method: "DELETE" })
  },
}
