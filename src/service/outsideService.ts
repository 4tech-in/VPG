import apiClient from "@/lib/api-client"

export type ApiOutside = {
  _id?: string
  id?: string
  outsideName: string
  outsideNote?: string
  projectId: any
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

export type GetOutsidesResponse = {
  success: boolean
  data: ApiOutside[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CreateOutsidePayload = {
  outsideName: string
  outsideNote?: string
  projectId: string
  status?: "active" | "inactive"
}

export const outsideService = {
  async getOutsides(params?: {
    projectId?: string
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<GetOutsidesResponse> {
    const query = new URLSearchParams()
    if (params?.projectId) query.append("projectId", params.projectId)
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.status) query.append("status", params.status)

    const queryString = query.toString()
    return apiClient.get<any, GetOutsidesResponse>(`/outsides${queryString ? `?${queryString}` : ""}`)
  },

  async getOutsideById(id: string): Promise<ApiOutside> {
    return apiClient.get<any, ApiOutside>(`/outsides/${id}`)
  },

  async createOutside(payload: CreateOutsidePayload): Promise<ApiOutside> {
    return apiClient.post<any, ApiOutside>("/outsides", payload)
  },

  async updateOutside(id: string, payload: Partial<CreateOutsidePayload>): Promise<ApiOutside> {
    return apiClient.put<any, ApiOutside>(`/outsides/${id}`, payload)
  },

  async deleteOutside(id: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete(`/outsides/${id}`)
  },
}
