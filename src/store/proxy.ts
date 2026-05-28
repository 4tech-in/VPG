import { useAuthStore } from "./use-auth-store"

/**
 * Utility to decode JWT token and check if it is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return true // Invalid JWT format
    
    // Decode base64url payload
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    
    const payload = JSON.parse(jsonPayload)
    if (!payload.exp) return false // If no exp is set, consider valid
    
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch (error) {
    return true // Decoding errors imply invalid/expired token
  }
}

/**
 * Validates current session token and automatically logs out / redirects if expired
 */
export function validateSession(forceLogout = false): boolean {
  const token = useAuthStore.getState().token
  
  if (forceLogout || !token || isTokenExpired(token)) {
    // Session is invalid or expired
    useAuthStore.getState().clearAuth()
    
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname
      // Avoid redirect loop if already on login/auth pages
      if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
        window.location.href = "/login"
      }
    }
    return false
  }
  
  return true
}

/**
 * Checks if the user has an active, unexpired session token
 */
export function hasActiveSession(): boolean {
  const token = useAuthStore.getState().token
  return !!token && !isTokenExpired(token)
}
