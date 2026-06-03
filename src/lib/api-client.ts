import { toast } from "sonner"
import { validateSession } from "@/store/proxy"
import { useAuthStore } from "@/store/use-auth-store"

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

type ApiOptions = RequestInit & {
  token?: string | null;
  isFormData?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  let token = options.token;

  if (typeof window !== "undefined") {
    if (path !== "/auth/login") {
      validateSession()
    }
    if (!token) {
      token = useAuthStore.getState().token
    }
  }

  const headers = new Headers(options.headers);

  if (!options.isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    let data: any = null;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `Request failed with status ${response.status}`;
      
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          validateSession(true);
        }
      } else if (response.status === 403) {
        toast.error("Forbidden. You do not have permission to access this resource.");
      } else {
        toast.error(message);
      }
      throw new Error(message);
    }

    if (data && typeof data === "object") {
      if (data.pagination !== undefined && data.data !== undefined) {
        return {
          data: data.data,
          pagination: data.pagination,
        } as unknown as T;
      }
      if (data.token !== undefined) {
        return data as T;
      }
      if (data.data !== undefined) {
        return data.data as T;
      }
    }

    return data as T;
  } catch (error: any) {
    if (error.name !== "Error") {
      toast.error(error.message || "An unexpected error occurred. Please try again.");
    }
    throw error;
  }
}

// Keep a backward compatible object if some components are importing `apiClient.get` etc.
// But ideally, everything will migrate to `apiRequest`.
const apiClient = {
  get: <T = any, R = any>(url: string, config?: any) => apiRequest<R>(url, { method: 'GET', ...config }),
  post: <T = any, R = any>(url: string, data?: any, config?: any) => apiRequest<R>(url, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data),
    isFormData: data instanceof FormData,
    ...config 
  }),
  patch: <T = any, R = any>(url: string, data?: any, config?: any) => apiRequest<R>(url, { 
    method: 'PATCH', 
    body: data instanceof FormData ? data : JSON.stringify(data),
    isFormData: data instanceof FormData,
    ...config 
  }),
  put: <T = any, R = any>(url: string, data?: any, config?: any) => apiRequest<R>(url, { 
    method: 'PUT', 
    body: data instanceof FormData ? data : JSON.stringify(data),
    isFormData: data instanceof FormData,
    ...config 
  }),
  delete: <T = any, R = any>(url: string, config?: any) => apiRequest<R>(url, { method: 'DELETE', ...config })
};

export default apiClient;
