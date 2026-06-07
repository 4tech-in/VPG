import { apiRequest } from "@/lib/api-client"

export type ApiAsset = {
  _id: string
  name: string
  type: string
  serialNumber?: string
  issuedDate?: string
  status: string
  maintenanceDueDate?: string
  extraNote?: string
}

export type CreateAssetPayload = Omit<ApiAsset, "_id">

export const assetService = {
  async getAssets(params?: { page?: number; limit?: number; search?: string; status?: string; type?: string; sortBy?: string; sortOrder?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`assets${queryString ? `?${queryString}` : ""}`)
  },

  async getAssetById(id: string): Promise<ApiAsset> {
    return apiRequest<ApiAsset>(`assets/${id}`)
  },

  async createAsset(payload: CreateAssetPayload): Promise<ApiAsset> {
    return apiRequest<ApiAsset>("assets", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateAsset(id: string, payload: Partial<CreateAssetPayload>): Promise<ApiAsset> {
    return apiRequest<ApiAsset>(`assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteAsset(id: string): Promise<void> {
    return apiRequest(`assets/${id}`, { method: "DELETE" })
  },

  async deleteMultipleAssets(ids: string[]): Promise<void> {
    return apiRequest("assets/delete-multiple", {
      method: "POST",
      body: JSON.stringify({ ids }),
    })
  },

  // --- Asset Tracking ---

  async getTrackAssets(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`track-assets${queryString ? `?${queryString}` : ""}`)
  },

  async getTrackAssetsByAssetId(assetId: string, params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`track-assets/asset/${assetId}${queryString ? `?${queryString}` : ""}`)
  },

  async createTrackAsset(payload: FormData): Promise<any> {
    return apiRequest<any>("track-assets", {
      method: "POST",
      body: payload,
      isFormData: true,
    })
  },

  async updateTrackAsset(id: string, payload: FormData | any): Promise<any> {
    const isFormData = payload instanceof FormData
    return apiRequest<any>(`track-assets/${id}`, {
      method: "PATCH",
      body: isFormData ? payload : JSON.stringify(payload),
      isFormData,
    })
  },

  async deleteTrackImage(id: string, body: { imagePath?: string; fileUrls?: string[] }): Promise<void> {
    return apiRequest(`track-assets/${id}/delete-image`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  async deleteTrackAsset(id: string): Promise<void> {
    return apiRequest(`track-assets/${id}`, { method: "DELETE" })
  }
}
