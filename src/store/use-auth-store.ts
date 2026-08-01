import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface UserRole {
  _id: string
  name: string
  permissions: string[]
  scope: string
}

export interface UserData {
  _id: string
  organizationId: string
  name: string
  email: string
  mobile: string
  roleId: UserRole
  nodeIds: string[]
  primaryNodeId: string | null
  reportsTo: string | null
  ancestorUserIds: string[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  token: string | null
  user: UserData | null
  isAuthenticated: boolean
  setAuth: (token: string, user: UserData) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true })
      },
      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false })
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }
      },
      hasPermission: (permission: string) => {
        const user = get().user
        if (!user || !user.roleId || !user.roleId.permissions) return false
        if (user.roleId.permissions.includes("*")) return true
        return user.roleId.permissions.includes(permission)
      },
    }),
    {
      name: "vpg-auth-store",
      storage: createJSONStorage(() => ({
        getItem: (name: string): string | null => {
          return localStorage.getItem(name) || sessionStorage.getItem(name)
        },
        setItem: (name: string, value: string): void => {
          if (localStorage.getItem('vpg-remember-me') === 'true') {
            localStorage.setItem(name, value)
            sessionStorage.removeItem(name)
          } else {
            sessionStorage.setItem(name, value)
            localStorage.removeItem(name)
          }
        },
        removeItem: (name: string): void => {
          localStorage.removeItem(name)
          sessionStorage.removeItem(name)
        }
      })),
    }
  )
)
