import { apiRequest } from "@/lib/api-client"

export type ApiBusinessNode = {
  _id: string
  name: string
  type: string
  parentNodeId?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type GetBusinessNodesResponse = {
  nodes: ApiBusinessNode[]
  pagination?: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateBusinessNodePayload = {
  name: string
  type: string
  parentNodeId?: string | null
}

export const businessNodeService = {
  async getBusinessNodes(params?: Record<string, string>): Promise<GetBusinessNodesResponse> {
    const query = new URLSearchParams(params).toString()
    const response = await apiRequest<any>(query ? `/business-nodes?${query}` : "/business-nodes")
    const nodes = Array.isArray(response) ? response : (response?.data || [])
    return {
      nodes,
      pagination: response?.pagination
    }
  },

  async getBusinessNodeById(id: string): Promise<ApiBusinessNode> {
    const response = await apiRequest<any>(`/business-nodes/${id}`)
    return response?.data || response
  },

  async createBusinessNode(payload: CreateBusinessNodePayload): Promise<ApiBusinessNode> {
    return apiRequest<ApiBusinessNode>("/business-nodes", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateBusinessNode(id: string, payload: Partial<CreateBusinessNodePayload> & { isActive?: boolean }): Promise<ApiBusinessNode> {
    return apiRequest<ApiBusinessNode>(`/business-nodes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteBusinessNode(id: string): Promise<void> {
    return apiRequest(`/business-nodes/${id}`, { method: "DELETE" })
  },
}
