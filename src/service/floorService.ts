import { apiRequest } from "@/lib/api-client"

export type ApiFloor = {
  _id?: string
  id?: string
  floorName: string
  floorNumber: string | number
  towerId: any
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

export type GetFloorsResponse = {
  success: boolean
  data: ApiFloor[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CreateFloorPayload = {
  floorName: string
  floorNumber: string | number
  towerId: string
  status?: "active" | "inactive"
}

export const floorService = {
  async getFloors(params?: {
    towerId?: string
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<GetFloorsResponse> {
    const query = new URLSearchParams()
    if (params?.towerId) query.append("towerId", params.towerId)
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.status) query.append("status", params.status)

    const queryString = query.toString()
    return apiRequest<GetFloorsResponse>(`floors${queryString ? `?${queryString}` : ""}`)
  },

  async getFloorById(id: string): Promise<ApiFloor> {
    return apiRequest<ApiFloor>(`floors/${id}`)
  },

  async createFloor(payload: CreateFloorPayload): Promise<ApiFloor> {
    return apiRequest<ApiFloor>("floors", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateFloor(id: string, payload: Partial<CreateFloorPayload>): Promise<ApiFloor> {
    return apiRequest<ApiFloor>(`floors/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteFloor(id: string): Promise<{ success: boolean; message?: string }> {
    return apiRequest(`floors/${id}`, { method: "DELETE" })
  },
}
