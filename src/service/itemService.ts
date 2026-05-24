import apiClient from "@/lib/api-client"

export type ApiItem = {
  id?: string
  _id?: string
  itemCode: string
  HSNcode?: string
  itemName: string
  blockItem: boolean
  specification?: string
  openingLedger?: string
  openingPhysical?: string
  size?: string
  info?: string
  unitId?: string | { _id: string; label: string; value: string }
  groupId?: string | { _id: string; name: string }
  subGroupId?: string | { _id: string; name: string }
  newItemCode?: string
  price?: string
  minLevel?: string
  maxLevel?: string
  gstPercentage?: string
}

export type GetItemsResponse = {
  items: ApiItem[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateItemPayload = {
  itemCode: string
  HSNcode?: string
  itemName: string
  blockItem?: boolean
  specification?: string
  openingLedger?: string
  openingPhysical?: string
  size?: string
  info?: string
  unitId?: string
  groupId?: string
  subGroupId?: string
  price?: string
  minLevel?: string
  maxLevel?: string
  gstPercentage?: string
}

export const itemService = {
  async getItems(params?: {
    page?: number
    limit?: number
    search?: string
    blockItem?: boolean
    unitId?: string
    groupId?: string
    subGroupId?: string
  }): Promise<GetItemsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.blockItem !== undefined) query.append("blockItem", String(params.blockItem))
    if (params?.unitId) query.append("unitId", params.unitId)
    if (params?.groupId) query.append("groupId", params.groupId)
    if (params?.subGroupId) query.append("subGroupId", params.subGroupId)

    const queryString = query.toString()
    const response = await apiClient.get<any, any>(`/items${queryString ? `?${queryString}` : ""}`)

    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        items: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      }
    } else {
      const items = Array.isArray(response) ? response : response?.data || []
      return {
        items,
        pagination: {
          page: 1,
          limit: items.length || 10,
          totalItems: items.length,
          totalPages: 1,
        },
      }
    }
  },

  async createItem(payload: CreateItemPayload): Promise<ApiItem> {
    return apiClient.post<any, ApiItem>("/items", payload)
  },

  async updateItem(id: string, payload: Partial<CreateItemPayload>): Promise<ApiItem> {
    return apiClient.put<any, ApiItem>(`/items/${id}`, payload)
  },

  async deleteItem(id: string): Promise<void> {
    return apiClient.delete(`/items/${id}`)
  },
}
