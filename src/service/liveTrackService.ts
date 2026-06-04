import { apiRequest } from "@/lib/api-client"

export type LiveTrackUser = {
  _id: string
  name: string
  email: string
  mobile?: string | null
  role?: string | null
}

export type LiveTrackNode = {
  _id: string
  name: string
  type: string
}

export type LiveTrackData = {
  _id: string
  organizationId: string
  nodeId?: string | null
  ownerId?: string | null
  userId: string
  latitude: number
  longitude: number
  location?: {
    type: string
    coordinates: [number, number]
  }
  accuracy?: number | null
  speed?: number | null
  heading?: number | null
  battery?: number | null
  isOnline: boolean
  lastUpdatedAt: string
  createdAt?: string
  updatedAt?: string
  user: LiveTrackUser
  node?: LiveTrackNode | null
}

export type GetLiveTracksResponse = {
  data: LiveTrackData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const liveTrackService = {
  async getLiveTracks(params?: {
    page?: number
    limit?: number
    search?: string
    userId?: string
  }): Promise<{ data: LiveTrackData[]; pagination: any }> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = String(params.page)
    if (params?.limit) queryParams.limit = String(params.limit)
    if (params?.search) queryParams.search = params.search
    if (params?.userId) queryParams.userId = params.userId

    const query = new URLSearchParams(queryParams).toString()
    const path = query ? `live-track?${query}` : "live-track"
    
    // Note: apiRequest returns { data, pagination } when both properties exist on the response
    return apiRequest<{ data: LiveTrackData[]; pagination: any }>(path)
  }
}
