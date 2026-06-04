import { apiRequest } from "@/lib/api-client"

export type ApiRole = {
  id?: string
  _id?: string
  organizationId: string
  name: string
  permissions: string[]
  scope: "organization" | "unit" | "child_units" | "team" | "self" | "custom"
  canCreateRoles: string[]
  isSystemRole: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type GetRolesResponse = {
  roles: ApiRole[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateRolePayload = {
  name: string
  permissions: string[]
  scope: string
  canCreateRoles?: string[]
  organizationId?: string
}

export const roleService = {
  async getRoles(params?: Record<string, string>): Promise<GetRolesResponse> {
    const query = new URLSearchParams(params).toString()
    const response = await apiRequest<any>(query ? `role?${query}` : "role")
    
    const roles = Array.isArray(response) ? response : (response?.data || [])
    return {
      roles,
      pagination: {
        page: 1,
        limit: roles.length || 10,
        totalItems: roles.length,
        totalPages: 1
      }
    }
  },

  async createRole(payload: CreateRolePayload): Promise<ApiRole> {
    return apiRequest<ApiRole>("role", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateRole(id: string, payload: Partial<CreateRolePayload> & { isActive?: boolean }): Promise<ApiRole> {
    return apiRequest<ApiRole>(`role/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteRole(id: string): Promise<void> {
    return apiRequest(`role/${id}`, { method: "DELETE" })
  },
}
