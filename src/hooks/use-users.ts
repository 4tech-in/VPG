import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { userService, ApiUser, CreateUserPayload } from "@/service/userService"
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
  // Full API bindings
  roleId: string
  nodeIds: string[]
  primaryNodeId: string
  reportsTo: string
  isActive: boolean
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

  return {
    id,
    name: apiUser.name,
    role: roleName,
    email: apiUser.email,
    phone: apiUser.mobile || "",
    properties: 0, // Mocked properties count or 0 default
    status: apiUser.isActive ? "Active" : "Inactive",
    roleId,
    nodeIds,
    primaryNodeId,
    reportsTo,
    isActive: apiUser.isActive ?? true,
  }
}

export function useUsers() {
  const [allUsers, setAllUsers] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await userService.getUsers()
      setAllUsers(response.map(mapApiUserToStaff))
    } catch (err: any) {
      const msg = err.message || "Failed to fetch users"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    const user = allUsers.find((u) => u.id === id)
    if (!user) return

    const nextIsActive = !user.isActive

    // Optimistic update
    setAllUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: nextIsActive, status: nextIsActive ? "Active" : "Inactive" } : u))
    )

    try {
      const updatedApiUser = await userService.updateUser(id, {
        isActive: nextIsActive
      })
      const updatedStaff = mapApiUserToStaff(updatedApiUser)
      setAllUsers((prev) => prev.map((u) => (u.id === id ? updatedStaff : u)))
      toast.success(`Member status updated to ${updatedStaff.status}`)
    } catch (err: any) {
      await fetchUsers()
      const msg = err.message || "Failed to update member status"
      toast.error(msg)
    }
  }

  // Client-side search and pagination
  const filteredUsers = useMemo(() => {
    if (!search) return allUsers
    const query = search.toLowerCase()
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    )
  }, [allUsers, search])

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredUsers.slice(startIndex, startIndex + limit)
  }, [filteredUsers, page, limit])

  const pagination = useMemo(() => {
    const totalItems = filteredUsers.length
    const totalPages = Math.ceil(totalItems / limit) || 1
    return {
      totalItems,
      totalPages,
    }
  }, [filteredUsers, limit])

  const calledRef = useRef(false)

  // Fetch on mount
  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true
    fetchUsers()
  }, [fetchUsers])

  return {
    users: paginatedUsers,
    allUsers,
    isLoading,
    error,
    refetch: fetchUsers,
    addUser,
    editUser,
    removeUser,
    toggleUserStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
