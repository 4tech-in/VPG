import { apiRequest } from "@/lib/api-client"

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
  profileImage?: string | null
  geofenceId?: any
  projectId?: any
  attendancePolicyId?: any
  createdAt?: string
  updatedAt?: string
  password?: string
}

export type GetUsersParams = {
  page?: number
  limit?: number
  search?: string
  status?: "active" | "inactive"
  role?: string
  sortBy?: "name" | "email" | "createdAt" | "status"
  sortOrder?: "asc" | "desc"
  organizationId?: string
}

export type GetUsersResponse = {
  success: boolean
  count: number
  data: ApiUser[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
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
  profileImage?: File | string | null
  geofenceId?: string | null
  projectId?: string | null
  attendancePolicyId?: string | null
  organizationId?: string | null
}

const convertToFormData = (obj: any): FormData => {
  const formData = new FormData()
  for (const key in obj) {
    if (obj[key] === undefined) continue
    
    const value = obj[key]
    if (value === null) {
      formData.append(key, "")
    } else if (Array.isArray(value)) {
      value.forEach((val) => {
        formData.append(`${key}[]`, val)
      })
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false")
    } else {
      formData.append(key, value)
    }
  }
  return formData
}

export const userService = {
  async getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
    const query = new URLSearchParams()
    if (params?.page)     query.append("page",      String(params.page))
    if (params?.limit)    query.append("limit",     String(params.limit))
    if (params?.search)   query.append("search",    params.search)
    if (params?.status)   query.append("status",    params.status)
    if (params?.role)     query.append("role",       params.role)
    if (params?.sortBy)   query.append("sortBy",     params.sortBy)
    if (params?.sortOrder) query.append("sortOrder", params.sortOrder)
    if (params?.organizationId) query.append("organizationId", params.organizationId)
    const qs = query.toString()
    const response = await apiRequest<any>(qs ? `user?${qs}` : "user")
    return response
  },
  
  async getUserById(id: string): Promise<ApiUser> {
    const response = await apiRequest<any>(`user/${id}`)
    return response?.data || response
  },

  async createUser(payload: CreateUserPayload): Promise<ApiUser> {
    const formData = convertToFormData(payload)
    const response = await apiRequest<any>("user", {
      method: "POST",
      body: formData,
      isFormData: true,
    })
    return response?.data || response
  },

  async updateUser(id: string, payload: Partial<CreateUserPayload> & { isActive?: boolean }): Promise<ApiUser> {
    const formData = convertToFormData(payload)
    const response = await apiRequest<any>(`user/${id}`, {
      method: "PATCH",
      body: formData,
      isFormData: true,
    })
    return response?.data || response
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest(`user/${id}`, { method: "DELETE" })
  },
}
