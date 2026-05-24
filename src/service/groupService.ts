import apiClient from "@/lib/api-client"

export type ApiGroup = {
  id?: string
  _id?: string
  name: string
  status: "active" | "inactive" | "Active" | "Inactive"
}

export type GetGroupsResponse = {
  groups: ApiGroup[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateGroupPayload = {
  name: string
  status: string
}

export const groupService = {
  async getGroups(params?: { page?: number; limit?: number; search?: string }): Promise<GetGroupsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)

    const queryString = query.toString()
    const response = await apiClient.get<any, any>(`/groups${queryString ? `?${queryString}` : ""}`)
    
    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        groups: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    } else {
      const groups = Array.isArray(response) ? response : (response?.data || [])
      return {
        groups,
        pagination: {
          page: 1,
          limit: groups.length || 10,
          totalItems: groups.length,
          totalPages: 1
        }
      }
    }
  },

  async createGroup(payload: CreateGroupPayload): Promise<ApiGroup> {
    return apiClient.post<any, ApiGroup>("/groups", payload)
  },

  async updateGroup(id: string, payload: Partial<CreateGroupPayload>): Promise<ApiGroup> {
    return apiClient.put<any, ApiGroup>(`/groups/${id}`, payload)
  },

  async deleteGroup(id: string): Promise<void> {
    return apiClient.delete(`/groups/${id}`)
  },
}
