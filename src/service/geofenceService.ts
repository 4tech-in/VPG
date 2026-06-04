import { apiRequest } from "@/lib/api-client"

export type ApiGeofence = {
  _id?: string
  id?: string
  name: string
  latitude: number
  longitude: number
  radiusInMeters: number
  address?: string
  status?: "active" | "inactive"
  createdAt?: string
}

export type GetGeofencesResponse = {
  geofences: ApiGeofence[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateGeofencePayload = {
  name: string
  latitude: number
  longitude: number
  radiusInMeters: number
  address?: string
  status?: "active" | "inactive"
}

export const geofenceService = {
  async getGeofences(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<GetGeofencesResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)
    if (params?.status) query.append("status", params.status)

    const queryString = query.toString()
    const response = await apiRequest<any>(`geofence${queryString ? `?${queryString}` : ""}`)

    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        geofences: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: response.pagination.totalPages || Math.ceil(total / limit) || 1,
        },
      }
    } else {
      const geofences = Array.isArray(response) ? response : response?.data || []
      return {
        geofences,
        pagination: {
          page: 1,
          limit: geofences.length || 10,
          totalItems: geofences.length,
          totalPages: 1,
        },
      }
    }
  },

  async createGeofence(payload: CreateGeofencePayload): Promise<ApiGeofence> {
    return apiRequest<ApiGeofence>("geofence", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((res: any) => res.data || res)
  },

  async updateGeofence(id: string, payload: Partial<CreateGeofencePayload>): Promise<ApiGeofence> {
    return apiRequest<ApiGeofence>(`geofence/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((res: any) => res.data || res)
  },

  async deleteGeofence(id: string): Promise<void> {
    return apiRequest(`geofence/${id}`, { method: "DELETE" })
  }
}
