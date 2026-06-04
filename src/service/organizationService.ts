import { apiRequest } from "@/lib/api-client"

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
  async getOrganizations(params?: Record<string, string>): Promise<GetOrganizationsResponse> {
    const query = new URLSearchParams(params).toString()
    const response = await apiRequest<any>(query ? `organizations?${query}` : "organizations")
    
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
    return apiRequest<ApiOrganization>("organizations", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateOrganization(id: string, payload: Partial<CreateOrganizationPayload>): Promise<ApiOrganization> {
    return apiRequest<ApiOrganization>(`organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteOrganization(id: string): Promise<void> {
    return apiRequest(`organizations/${id}`, { method: "DELETE" })
  },
}
