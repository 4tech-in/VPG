import { useState, useEffect, useCallback, useRef } from "react"
import { groupService, CreateGroupPayload, ApiGroup } from "@/service/groupService"
import { toast } from "sonner"

export type Group = {
  id: string
  name: string
  status: "Active" | "Inactive"
}

const mapApiGroupToGroup = (apiGroup: ApiGroup): Group => {
  const id = String(apiGroup.id || apiGroup._id || "")
  const status = apiGroup.status.toLowerCase() === "active" ? "Active" : "Inactive"
  return {
    id,
    name: apiGroup.name,
    status,
  }
}

export function useGroups(autoFetch = true) {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
  })

  const lastFetchedRef = useRef<{ search: string; page: number; limit: number } | null>(null)

  const fetchGroups = useCallback(async (currentSearch = search, currentPage = page) => {
    if (
      lastFetchedRef.current &&
      lastFetchedRef.current.search === currentSearch &&
      lastFetchedRef.current.page === currentPage &&
      lastFetchedRef.current.limit === limit
    ) {
      return
    }

    const fetchLimit = autoFetch ? limit : 1000
    lastFetchedRef.current = { search: currentSearch, page: currentPage, limit: fetchLimit }

    setIsLoading(true)
    setError(null)
    try {
      const response = await groupService.getGroups({
        page: currentPage,
        limit: fetchLimit,
        search: currentSearch,
      })
      
      const { groups: rawGroups, pagination: backendPagination } = response
      setGroups(rawGroups.map(mapApiGroupToGroup))
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch groups"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search, autoFetch])

  const addGroup = async (payload: CreateGroupPayload) => {
    setIsLoading(true)
    try {
      const newApiGroup = await groupService.createGroup(payload)
      const newGroup = mapApiGroupToGroup(newApiGroup)
      lastFetchedRef.current = null
      await fetchGroups(debouncedSearch, page)
      toast.success(`Group "${newGroup.name}" created successfully`)
      return newGroup
    } catch (err: any) {
      const msg = err.message || "Failed to create group"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editGroup = async (id: string, payload: Partial<CreateGroupPayload>) => {
    setIsLoading(true)
    try {
      const updatedApiGroup = await groupService.updateGroup(id, payload)
      const updatedGroup = mapApiGroupToGroup(updatedApiGroup)
      lastFetchedRef.current = null
      await fetchGroups(debouncedSearch, page)
      toast.success(`Group "${updatedGroup.name}" updated successfully`)
      return updatedGroup
    } catch (err: any) {
      const msg = err.message || "Failed to update group"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeGroup = async (id: string) => {
    setIsLoading(true)
    try {
      await groupService.deleteGroup(id)
      setGroups((prev) => prev.filter((g) => g.id !== id))
      toast.success("Group deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete group"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroupStatus = async (id: string) => {
    const group = groups.find((g) => g.id === id)
    if (!group) return

    const nextStatus = group.status === "Active" ? "Inactive" : "Active"

    // Optimistically update local state for instantaneous toggle animation
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: nextStatus } : g))
    )

    try {
      const updatedApiGroup = await groupService.updateGroup(id, {
        status: nextStatus === "Active" ? "active" : "inactive"
      })
      const updatedGroup = mapApiGroupToGroup(updatedApiGroup)
      setGroups((prev) => prev.map((g) => (g.id === id ? updatedGroup : g)))
      toast.success(`Group "${updatedGroup.name}" status updated successfully`)
    } catch (err: any) {
      // Revert to server data on failure
      try {
        lastFetchedRef.current = null
        await fetchGroups(debouncedSearch, page)
      } catch (fetchErr) {}
      const msg = err.message || "Failed to update group status"
      toast.error(msg)
    }
  }

  // Debounce search query to reset page and delay API fetching
  useEffect(() => {
    if (!autoFetch) return
    // Skip the initial trigger on mount if search is empty to prevent double fetch
    if (search === "" && debouncedSearch === "") return

    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)

    return () => clearTimeout(handler)
  }, [search, debouncedSearch, autoFetch])

  // Reactively fetch data when page, limit, or debounced search changes
  useEffect(() => {
    if (!autoFetch) return
    fetchGroups(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchGroups, autoFetch])

  return {
    groups,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchGroups(debouncedSearch, page)
    },
    addGroup,
    editGroup,
    removeUnit: removeGroup, // keep backwards compatibility if any
    removeGroup,
    toggleGroupStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}

