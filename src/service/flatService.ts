import { apiRequest } from "@/lib/api-client"

export type ApiFlat = {
  _id?: string
  id?: string
  flatName: string
  flatNumber: string | number
  floorId: any
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

export type GetFlatsResponse = {
  success: boolean
  data: ApiFlat[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CreateFlatPayload = {
  flatName: string
  flatNumber: string | number
  floorId: string
  status?: "active" | "inactive"
}

export const flatService = {
  async getFlats(params?: {
    floorId?: string
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<GetFlatsResponse> {
    const query = new URLSearchParams()
    if (params?.floorId) query.append("floorId", params.floorId)
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.status) query.append("status", params.status)

    const queryString = query.toString()
    return apiRequest<GetFlatsResponse>(`/flats${queryString ? `?${queryString}` : ""}`)
  },

  async getFlatById(id: string): Promise<ApiFlat> {
    return apiRequest<ApiFlat>(`/flats/${id}`)
  },

  async createFlat(payload: CreateFlatPayload): Promise<ApiFlat> {
    return apiRequest<ApiFlat>("/flats", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateFlat(id: string, payload: Partial<CreateFlatPayload>): Promise<ApiFlat> {
    return apiRequest<ApiFlat>(`/flats/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteFlat(id: string): Promise<{ success: boolean; message?: string }> {
    return apiRequest(`/flats/${id}`, { method: "DELETE" })
  },
}
