import apiClient from "@/lib/api-client"

export type PopulatedRole = {
  _id: string
  name: string
  scope: string
  permissions: string[]
}

export type PopulatedNode = {
  _id: string
  name: string
  type: string
}

export type PopulatedUser = {
  _id: string
  name: string
  email: string
}

export type ApiUser = {
  id?: string
  _id?: string
  organizationId: string
  name: string
  email: string
  mobile?: string | null
  roleId: PopulatedRole | string
  nodeIds: (PopulatedNode | string)[]
  primaryNodeId?: PopulatedNode | string | null
  reportsTo?: PopulatedUser | string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type GetUsersResponse = {
  success: boolean
  count: number
  data: ApiUser[]
}

export type CreateUserPayload = {
  name: string
  email: string
  mobile?: string
  password?: string
  roleId: string
  nodeIds?: string[]
  primaryNodeId?: string | null
  reportsTo?: string | null
}

export const userService = {
  async getUsers(): Promise<ApiUser[]> {
    const response = await apiClient.get<any, any>("/user")
    return Array.isArray(response) ? response : (response?.data || [])
  },

  async createUser(payload: CreateUserPayload): Promise<ApiUser> {
    const response = await apiClient.post<any, any>("/user", payload)
    return response?.data || response
  },

  async updateUser(id: string, payload: Partial<CreateUserPayload> & { isActive?: boolean }): Promise<ApiUser> {
    const response = await apiClient.patch<any, any>(`/user/${id}`, payload)
    return response?.data || response
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/user/${id}`)
  },
}
