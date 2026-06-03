import apiClient from "@/lib/api-client"

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
  async getRoles(): Promise<GetRolesResponse> {
    const response = await apiClient.get<any, any>("/role")
    
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
    return apiClient.post<any, ApiRole>("/role", payload)
  },

  async updateRole(id: string, payload: Partial<CreateRolePayload> & { isActive?: boolean }): Promise<ApiRole> {
    return apiClient.patch<any, ApiRole>(`/role/${id}`, payload)
  },

  async deleteRole(id: string): Promise<void> {
    return apiClient.delete(`/role/${id}`)
  },
}
