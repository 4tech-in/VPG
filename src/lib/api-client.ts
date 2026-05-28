import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios"
import { toast } from "sonner"
import { validateSession } from "@/store/proxy"
import { useAuthStore } from "@/store/use-auth-store"


// Define standard API response shape if required
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

// 1. Create a configured Axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// 2. Request Interceptor: Attach authentication token, headers, logs, etc.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Retrieve authentication token from auth store if it exists
    if (typeof window !== "undefined") {
      if (config.url !== "/auth/login") {
        validateSession()
      }
      const token = useAuthStore.getState().token
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 3. Response Interceptor: Format output, manage global loader or toast error responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // You can directly return response.data to simplify client service consumption
    const res = response.data
    if (res && typeof res === "object") {
      if (res.pagination !== undefined && res.data !== undefined) {
        return {
          data: res.data,
          pagination: res.pagination,
        }
      }
      if (res.token !== undefined) {
        return res
      }
      if (res.data !== undefined) {
        return res.data
      }
    }
    return res
  },
  (error: AxiosError) => {
    let errorMessage = "An unexpected error occurred. Please try again."

    if (error.response) {
      const status = error.response.status
      const responseData = error.response.data as any

      // Extract specific error messages returned from server if available
      if (responseData && responseData.message) {
        errorMessage = responseData.message
      } else {
        switch (status) {
          case 400:
            errorMessage = "Bad Request. Please check your inputs."
            break
          case 401:
            errorMessage = "Unauthorized. Please log in again."
            if (typeof window !== "undefined") {
              validateSession(true)
            }
            break
          case 403:
            errorMessage = "Forbidden. You do not have permission to access this resource."
            break
          case 404:
            errorMessage = "Requested resource not found."
            break
          case 500:
            errorMessage = "Internal Server Error. Please contact support."
            break
          default:
            errorMessage = `Request failed with status ${status}`
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response received from server. Please verify your connection."
    } else {
      errorMessage = error.message
    }

    // Trigger gorgeous toast alert for errors
    toast.error(errorMessage)

    return Promise.reject(new Error(errorMessage))
  }
)

export default apiClient
