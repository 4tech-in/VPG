import apiClient from "@/lib/api-client"

export type ApiSubGroup = {
  id?: string
  _id?: string
  groupId: string | { _id: string; name: string }
  name: string
  status: "active" | "inactive" | "Active" | "Inactive"
}


export type GetSubGroupsResponse = {
  subGroups: ApiSubGroup[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateSubGroupPayload = {
  groupId: string
  name: string
  status: string
}

export const subGroupService = {
  async getSubGroups(params?: { page?: number; limit?: number; search?: string }): Promise<GetSubGroupsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)

    const queryString = query.toString()
    const response = await apiClient.get<any, any>(`/sub-groups${queryString ? `?${queryString}` : ""}`)
    
    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        subGroups: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    } else {
      const subGroups = Array.isArray(response) ? response : (response?.data || [])
      return {
        subGroups,
        pagination: {
          page: 1,
          limit: subGroups.length || 10,
          totalItems: subGroups.length,
          totalPages: 1
        }
      }
    }
  },

  async createSubGroup(payload: CreateSubGroupPayload): Promise<ApiSubGroup> {
    return apiClient.post<any, ApiSubGroup>("/sub-groups", payload)
  },

  async updateSubGroup(id: string, payload: Partial<CreateSubGroupPayload>): Promise<ApiSubGroup> {
    return apiClient.put<any, ApiSubGroup>(`/sub-groups/${id}`, payload)
  },

  async deleteSubGroup(id: string): Promise<void> {
    return apiClient.delete(`/sub-groups/${id}`)
  },
}
