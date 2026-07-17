import { useState, useEffect, useCallback, useRef } from "react"
import { userService, ApiUser, CreateUserPayload, GetUsersParams } from "@/service/userService"
import { toast } from "sonner"

export type Staff = {
  id: string
  name: string
  role: string
  email: string
  phone: string
  properties: number
  status: "Active" | "Inactive"
  avatarUrl?: string
  password?: string
  // Full API bindings
  roleId: string
  nodeIds: string[]
  primaryNodeId: string
  reportsTo: string
  isActive: boolean
  geofenceId: string
  projectId: string
  attendancePolicyId: string
  geofenceName?: string
  projectName?: string
  attendancePolicyName?: string
  reportsToName?: string
  organizationId?: string
}

const mapApiUserToStaff = (apiUser: ApiUser): Staff => {
  const id = String(apiUser.id || apiUser._id || "")
  const roleName = typeof apiUser.roleId === "object" && apiUser.roleId ? apiUser.roleId.name : "Sales Agent"
  const roleId = typeof apiUser.roleId === "object" && apiUser.roleId ? apiUser.roleId._id : String(apiUser.roleId || "")
  
  const nodeIds = Array.isArray(apiUser.nodeIds)
    ? apiUser.nodeIds.map((n) => (typeof n === "object" && n ? n._id : String(n)))
    : []
    
  const primaryNodeId = typeof apiUser.primaryNodeId === "object" && apiUser.primaryNodeId
    ? apiUser.primaryNodeId._id
    : String(apiUser.primaryNodeId || "")

  const reportsTo = typeof apiUser.reportsTo === "object" && apiUser.reportsTo
    ? apiUser.reportsTo._id
    : String(apiUser.reportsTo || "")

  const geofenceId = typeof apiUser.geofenceId === "object" && apiUser.geofenceId
    ? (apiUser.geofenceId._id || apiUser.geofenceId.id || String(apiUser.geofenceId))
    : String(apiUser.geofenceId || "")

  const geofenceName = typeof apiUser.geofenceId === "object" && apiUser.geofenceId
    ? apiUser.geofenceId.name
    : undefined
    
  const reportsToName = typeof apiUser.reportsTo === "object" && apiUser.reportsTo
    ? apiUser.reportsTo.name
    : undefined

  const projectId = typeof apiUser.projectId === "object" && apiUser.projectId
    ? (apiUser.projectId._id || apiUser.projectId.id || String(apiUser.projectId))
    : String(apiUser.projectId || "")

  const projectName = typeof apiUser.projectId === "object" && apiUser.projectId
    ? (apiUser.projectId.projectName || apiUser.projectId.name)
    : undefined

  const attendancePolicyId = typeof apiUser.attendancePolicyId === "object" && apiUser.attendancePolicyId
    ? (apiUser.attendancePolicyId._id || apiUser.attendancePolicyId.id || String(apiUser.attendancePolicyId))
    : String(apiUser.attendancePolicyId || "")

  const attendancePolicyName = typeof apiUser.attendancePolicyId === "object" && apiUser.attendancePolicyId
    ? apiUser.attendancePolicyId.name
    : undefined

  return {
    id,
    name: apiUser.name,
    role: roleName,
    email: apiUser.email,
    phone: apiUser.mobile || "",
    properties: 0,
    status: apiUser.isActive ? "Active" : "Inactive",
    roleId,
    nodeIds,
    primaryNodeId,
    reportsTo,
    isActive: apiUser.isActive ?? true,
    avatarUrl: apiUser.profileImage ? `${process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/api$/, "")}${apiUser.profileImage}` : undefined,
    geofenceId,
    projectId,
    attendancePolicyId,
    geofenceName,
    projectName,
    attendancePolicyName,
    reportsToName,
    organizationId: apiUser.organizationId,
    password: apiUser.password,
  }
}

export function useUsers(options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false

  const [users, setUsers] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Server-side state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("")
  const [roleFilter, setRoleFilter] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt" | "status">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  const fetchUsers = useCallback(async (params?: GetUsersParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await userService.getUsers({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        sortBy,
        sortOrder,
        ...params,
      })
      const data = response?.data || []
      setUsers(data.map(mapApiUserToStaff))
      if (response?.pagination) {
        setPagination(response.pagination)
      } else {
        setPagination({ total: data.length, page: 1, limit: data.length || 10, totalPages: 1 })
      }
    } catch (err: any) {
      const msg = err.message || "Failed to fetch users"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, statusFilter, roleFilter, sortBy, sortOrder])

  const addUser = async (payload: CreateUserPayload) => {
    setIsLoading(true)
    try {
      const newApiUser = await userService.createUser(payload)
      const newStaff = mapApiUserToStaff(newApiUser)
      await fetchUsers()
      toast.success(`Staff member "${newStaff.name}" registered successfully`)
      return newStaff
    } catch (err: any) {
      const msg = err.message || "Failed to register staff member"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editUser = async (id: string, payload: Partial<CreateUserPayload> & { isActive?: boolean }) => {
    setIsLoading(true)
    try {
      const updatedApiUser = await userService.updateUser(id, payload)
      const updatedStaff = mapApiUserToStaff(updatedApiUser)
      await fetchUsers()
      toast.success(`Staff profile for "${updatedStaff.name}" updated successfully`)
      return updatedStaff
    } catch (err: any) {
      const msg = err.message || "Failed to update staff member"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeUser = async (id: string) => {
    setIsLoading(true)
    try {
      await userService.deleteUser(id)
      await fetchUsers()
      toast.success("Staff member deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete staff member"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (id: string) => {
    const user = users.find((u) => u.id === id)
    if (!user) return

    const nextIsActive = !user.isActive

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: nextIsActive, status: nextIsActive ? "Active" : "Inactive" } : u))
    )

    try {
      const updatedApiUser = await userService.updateUser(id, { isActive: nextIsActive })
      const updatedStaff = mapApiUserToStaff(updatedApiUser)
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedStaff : u)))
      toast.success(`Member status updated to ${updatedStaff.status}`)
    } catch (err: any) {
      await fetchUsers()
      const msg = err.message || "Failed to update member status"
      toast.error(msg)
    }
  }

  const getUserById = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const apiUser = await userService.getUserById(id)
      return mapApiUserToStaff(apiUser)
    } catch (err: any) {
      const msg = err.message || "Failed to fetch user"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Re-fetch whenever any filter/page/sort param changes
  const calledRef = useRef(false)
  useEffect(() => {
    if (skipFetch) return
    fetchUsers()
  }, [fetchUsers, skipFetch])

  // Reset to page 1 when filters change (not on page change itself)
  const setSearchWithReset = (v: string) => { setSearch(v); setPage(1) }
  const setStatusFilterWithReset = (v: "" | "active" | "inactive") => { setStatusFilter(v); setPage(1) }
  const setRoleFilterWithReset = (v: string) => { setRoleFilter(v); setPage(1) }
  const setLimitWithReset = (v: number) => { setLimit(v); setPage(1) }

  return {
    users,
    allUsers: users, // kept for backward compat
    isLoading,
    error,
    refetch: fetchUsers,
    addUser,
    editUser,
    removeUser,
    toggleUserStatus,
    getUserById,
    // Pagination
    page,
    setPage,
    limit,
    setLimit: setLimitWithReset,
    pagination,
    // Filters & sort
    search,
    setSearch: setSearchWithReset,
    statusFilter,
    setStatusFilter: setStatusFilterWithReset,
    roleFilter,
    setRoleFilter: setRoleFilterWithReset,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  }
}
