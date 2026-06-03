import { apiRequest } from "@/lib/api-client"

export type ApiAttendance = {
  _id: string
  userId: string | any
  date: string
  checkInTime?: string
  checkOutTime?: string
  status: string
  location?: { lat: number; lng: number; address: string }
}

export type ApiLiveTracking = {
  _id: string
  userId: string | any
  latitude: number
  longitude: number
  timestamp: string
}

export const attendanceService = {
  async getAttendance(params?: { page?: number; limit?: number; search?: string; userId?: string; startDate?: string; endDate?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`/attendance${queryString ? `?${queryString}` : ""}`)
  },

  async getAttendanceById(id: string): Promise<ApiAttendance> {
    return apiRequest<ApiAttendance>(`/attendance/${id}`)
  },

  async getMyAttendance(params?: { page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`/attendance/me${queryString ? `?${queryString}` : ""}`)
  },

  async checkIn(payload: any): Promise<ApiAttendance> {
    return apiRequest<ApiAttendance>("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async checkOut(payload: any): Promise<ApiAttendance> {
    return apiRequest<ApiAttendance>("/attendance/check-out", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateAttendance(id: string, payload: any): Promise<ApiAttendance> {
    return apiRequest<ApiAttendance>(`/attendance/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async getLiveTracking(params?: { userId?: string; date?: string; page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`/live-tracking${queryString ? `?${queryString}` : ""}`)
  },
}
