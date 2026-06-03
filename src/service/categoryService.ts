import { apiRequest } from "@/lib/api-client"

export type ApiCategory = {
  _id: string
  name: string
  groupIds: string[]
  isActive: boolean
}

export type CreateCategoryPayload = {
  name: string
  groupIds: string[]
}

export const categoryService = {
  async getCategories(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)

    const queryString = query.toString()
    return apiRequest<any>(`/categories${queryString ? `?${queryString}` : ""}`)
  },

  async getCategoryById(id: string): Promise<ApiCategory> {
    return apiRequest<ApiCategory>(`/categories/${id}`)
  },

  async createCategory(payload: CreateCategoryPayload): Promise<ApiCategory> {
    return apiRequest<ApiCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateCategory(id: string, payload: Partial<CreateCategoryPayload>): Promise<ApiCategory> {
    return apiRequest<ApiCategory>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  async deleteCategory(id: string): Promise<void> {
    return apiRequest(`/categories/${id}`, { method: "DELETE" })
  },
}
