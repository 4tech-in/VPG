import { apiRequest } from "@/lib/api-client"

export type ApiUnit = {
  id?: string
  _id?: string
  label: string
  value: string
  status: "active" | "inactive" | "Active" | "Inactive"
}

export type GetUnitsResponse = {
  units: ApiUnit[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateUnitPayload = {
  label: string
  value: string
  status: string
}

export const unitService = {
  async getUnits(params?: { page?: number; limit?: number; search?: string }): Promise<GetUnitsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)

    const queryString = query.toString()
    const response = await apiRequest<any>(`/units${queryString ? `?${queryString}` : ""}`)
    
    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        units: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    } else {
      const units = Array.isArray(response) ? response : (response?.data || [])
      return {
        units,
        pagination: {
          page: 1,
          limit: units.length || 10,
          totalItems: units.length,
          totalPages: 1
        }
      }
    }
  },

  async createUnit(payload: CreateUnitPayload): Promise<ApiUnit> {
    return apiRequest<ApiUnit>("/units", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateUnit(id: string, payload: Partial<CreateUnitPayload>): Promise<ApiUnit> {
    return apiRequest<ApiUnit>(`/units/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteUnit(id: string): Promise<void> {
    return apiRequest(`/units/${id}`, { method: "DELETE" })
  },
}
