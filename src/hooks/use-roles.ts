import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { roleService, CreateRolePayload, ApiRole } from "@/service/roleService"
import { toast } from "sonner"

export type Role = {
  id: string
  name: string
  permissions: string[]
  scope: "organization" | "unit" | "child_units" | "team" | "self" | "custom"
  canCreateRoles: string[]
  isSystemRole: boolean
  isActive: boolean
  status: "Active" | "Inactive"
  organizationId?: string
}

const mapApiRoleToRole = (apiRole: ApiRole): Role => {
  const id = String(apiRole.id || apiRole._id || "")
  return {
    id,
    name: apiRole.name,
    permissions: apiRole.permissions || [],
    scope: apiRole.scope || "self",
    canCreateRoles: apiRole.canCreateRoles || [],
    isSystemRole: apiRole.isSystemRole ?? false,
    isActive: apiRole.isActive ?? true,
    status: apiRole.isActive ? "Active" : "Inactive",
    organizationId: apiRole.organizationId,
  }
}

export function useRoles(options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await roleService.getRoles()
      setAllRoles(response.roles.map(mapApiRoleToRole))
    } catch (err: any) {
      const msg = err.message || "Failed to fetch roles"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addRole = async (payload: CreateRolePayload) => {
    setIsLoading(true)
    try {
      const newApiRole = await roleService.createRole(payload)
      const newRole = mapApiRoleToRole(newApiRole)
      await fetchRoles()
      toast.success(`Role "${newRole.name}" created successfully`)
      return newRole
    } catch (err: any) {
      const msg = err.message || "Failed to create role"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editRole = async (id: string, payload: Partial<CreateRolePayload> & { isActive?: boolean }) => {
    setIsLoading(true)
    try {
      const updatedApiRole = await roleService.updateRole(id, payload)
      const updatedRole = mapApiRoleToRole(updatedApiRole)
      await fetchRoles()
      toast.success(`Role "${updatedRole.name}" updated successfully`)
      return updatedRole
    } catch (err: any) {
      const msg = err.message || "Failed to update role"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeRole = async (id: string) => {
    setIsLoading(true)
    try {
      await roleService.deleteRole(id)
      await fetchRoles()
      toast.success("Role deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete role"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRoleStatus = async (id: string) => {
    const role = allRoles.find((r) => r.id === id)
    if (!role) return

    if (role.isSystemRole) {
      toast.error("System roles cannot be disabled.")
      return
    }

    const nextIsActive = !role.isActive

    // Optimistic update
    setAllRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: nextIsActive, status: nextIsActive ? "Active" : "Inactive" } : r))
    )

    try {
      const updatedApiRole = await roleService.updateRole(id, {
        isActive: nextIsActive
      })
      const updatedRole = mapApiRoleToRole(updatedApiRole)
      setAllRoles((prev) => prev.map((r) => (r.id === id ? updatedRole : r)))
      toast.success(`Role "${updatedRole.name}" status updated successfully`)
    } catch (err: any) {
      await fetchRoles()
      const msg = err.message || "Failed to update role status"
      toast.error(msg)
    }
  }

  // Client-side search and pagination
  const filteredRoles = useMemo(() => {
    if (!search) return allRoles
    const query = search.toLowerCase()
    return allRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.scope.toLowerCase().includes(query)
    )
  }, [allRoles, search])

  const paginatedRoles = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredRoles.slice(startIndex, startIndex + limit)
  }, [filteredRoles, page, limit])

  const pagination = useMemo(() => {
    const totalItems = filteredRoles.length
    const totalPages = Math.ceil(totalItems / limit) || 1
    return {
      totalItems,
      totalPages,
    }
  }, [filteredRoles, limit])

  const calledRef = useRef(false)

  // Fetch on mount
  useEffect(() => {
    if (skipFetch) return
    if (calledRef.current) return
    calledRef.current = true
    fetchRoles()
  }, [fetchRoles, skipFetch])

  return {
    roles: paginatedRoles,
    allRoles,
    isLoading,
    error,
    refetch: fetchRoles,
    addRole,
    editRole,
    removeRole,
    toggleRoleStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
