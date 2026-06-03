import { apiRequest } from "@/lib/api-client"

export type ApiTower = {
  _id?: string
  id?: string
  towerName: string
  towerNumber: string
  projectId: string
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

export type GetTowersResponse = {
  success: boolean
  data: ApiTower[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CreateTowerPayload = {
  towerName: string
  towerNumber: string
  projectId: string
  status?: "active" | "inactive"
}

export const towerService = {
  async getTowers(params?: {
    projectId?: string
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<GetTowersResponse> {
    const query = new URLSearchParams()
    if (params?.projectId) query.append("projectId", params.projectId)
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.status) query.append("status", params.status)

    const queryString = query.toString()
    return apiRequest<GetTowersResponse>(`/towers${queryString ? `?${queryString}` : ""}`)
  },

  async getTowerById(id: string): Promise<ApiTower> {
    return apiRequest<ApiTower>(`/towers/${id}`)
  },

  async createTower(payload: CreateTowerPayload): Promise<ApiTower> {
    return apiRequest<ApiTower>("/towers", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateTower(id: string, payload: Partial<CreateTowerPayload>): Promise<ApiTower> {
    return apiRequest<ApiTower>(`/towers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteTower(id: string): Promise<{ success: boolean; message?: string }> {
    return apiRequest(`/towers/${id}`, { method: "DELETE" })
  },
}
