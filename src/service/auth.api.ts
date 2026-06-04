import { apiRequest } from "@/lib/api-client"

export type LoginPayload = {
  emailOrMobile: string
  password: string
  deviceId?: string
}

export type LoginResponse = {
  success: boolean
  message: string
  token: string
  data: {
    _id: string
    name: string
    email: string
    roleId: any
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async me(): Promise<any> {
    return apiRequest<any>("/auth/me", {
      method: "GET",
    })
  },
}
