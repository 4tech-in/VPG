import apiClient from "@/lib/api-client"

export type ApiOrganization = {
  id?: string
  _id?: string
  name: string
  industryType?: string | null
  email?: string | null
  mobile?: string | null
  address?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type GetOrganizationsResponse = {
  organizations: ApiOrganization[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateOrganizationPayload = {
  name: string
  industryType?: string | null
  email?: string | null
  mobile?: string | null
  address?: string | null
  isActive?: boolean
}

export const organizationService = {
  async getOrganizations(): Promise<GetOrganizationsResponse> {
    const response = await apiClient.get<any, any>("/organizations")
    
    const organizations = Array.isArray(response) ? response : (response?.data || [])
    return {
      organizations,
      pagination: {
        page: 1,
        limit: organizations.length || 10,
        totalItems: organizations.length,
        totalPages: 1
      }
    }
  },

  async createOrganization(payload: CreateOrganizationPayload): Promise<ApiOrganization> {
    return apiClient.post<any, ApiOrganization>("/organizations", payload)
  },

  async updateOrganization(id: string, payload: Partial<CreateOrganizationPayload>): Promise<ApiOrganization> {
    return apiClient.patch<any, ApiOrganization>(`/organizations/${id}`, payload)
  },

  async deleteOrganization(id: string): Promise<void> {
    return apiClient.delete(`/organizations/${id}`)
  },
}
