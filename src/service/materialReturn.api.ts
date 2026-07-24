import { apiRequest } from "@/lib/api-client"

export const materialReturnService = {
  async getReturns(params?: { page?: number; limit?: number; projectId?: string; materialId?: string; search?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`material-returns${queryString ? `?${queryString}` : ""}`)
  },
  
  async getReturnById(id: string): Promise<any> {
    return apiRequest<any>(`material-returns/${id}`)
  }
}
