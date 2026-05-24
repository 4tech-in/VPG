import { useState, useEffect, useCallback, useRef } from "react"
import { subGroupService, CreateSubGroupPayload } from "@/service/subGroupService"
import { toast } from "sonner"


export type SubGroup = {
  id: string
  groupId: string
  group: string
  subGroup: string
  status: "Active" | "Inactive"
}

export function useSubGroups() {
  const [subGroups, setSubGroups] = useState<SubGroup[]>([])
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

  const fetchSubGroupsAndGroups = useCallback(async (currentSearch = search, currentPage = page) => {
    if (
      lastFetchedRef.current &&
      lastFetchedRef.current.search === currentSearch &&
      lastFetchedRef.current.page === currentPage &&
      lastFetchedRef.current.limit === limit
    ) {
      return
    }

    lastFetchedRef.current = { search: currentSearch, page: currentPage, limit }

    setIsLoading(true)
    setError(null)
    try {
      const response = await subGroupService.getSubGroups({
        page: currentPage,
        limit,
        search: currentSearch,
      })

      const { subGroups: rawSubGroups, pagination: backendPagination } = response

      const mapped: SubGroup[] = rawSubGroups.map((sg) => {
        const id = String(sg.id || sg._id || "")
        
        let resolvedGroupId = ""
        let resolvedGroupName = "Unknown Group"

        if (sg.groupId && typeof sg.groupId === "object") {
          resolvedGroupId = String((sg.groupId as any)._id || "")
          resolvedGroupName = (sg.groupId as any).name || "Unknown Group"
        } else {
          resolvedGroupId = String(sg.groupId || "")
          resolvedGroupName = "Unknown Group"
        }

        return {
          id,
          groupId: resolvedGroupId,
          group: resolvedGroupName,
          subGroup: sg.name,
          status: sg.status.toLowerCase() === "active" ? "Active" : "Inactive",
        }
      })

      setSubGroups(mapped)
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch sub groups"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search]) // Include dependencies so current state refs are correctly mapped

  const addSubGroup = async (payload: CreateSubGroupPayload) => {
    setIsLoading(true)
    try {
      const newRaw = await subGroupService.createSubGroup(payload)
      lastFetchedRef.current = null
      await fetchSubGroupsAndGroups(debouncedSearch, page)
      toast.success(`Sub Group "${newRaw.name}" created successfully`)
      return newRaw
    } catch (err: any) {
      const msg = err.message || "Failed to create sub group"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editSubGroup = async (id: string, payload: Partial<CreateSubGroupPayload>) => {
    setIsLoading(true)
    try {
      const updatedRaw = await subGroupService.updateSubGroup(id, payload)
      lastFetchedRef.current = null
      await fetchSubGroupsAndGroups(debouncedSearch, page)
      toast.success(`Sub Group "${updatedRaw.name}" updated successfully`)
      return updatedRaw
    } catch (err: any) {
      const msg = err.message || "Failed to update sub group"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeSubGroup = async (id: string) => {
    setIsLoading(true)
    try {
      await subGroupService.deleteSubGroup(id)
      setSubGroups((prev) => prev.filter((sg) => sg.id !== id))
      toast.success("Sub Group deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete sub group"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubGroupStatus = async (id: string) => {
    const sub = subGroups.find((s) => s.id === id)
    if (!sub) return

    const nextStatus = sub.status === "Active" ? "Inactive" : "Active"

    // Optimistically update local state for instantaneous toggle animation
    setSubGroups((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    )

    try {
      const updatedRaw = await subGroupService.updateSubGroup(id, {
        status: nextStatus === "Active" ? "active" : "inactive"
      })
      setSubGroups((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: updatedRaw.status.toLowerCase() === "active" ? "Active" : "Inactive" }
            : s
        )
      )
      toast.success(`Sub Group "${sub.subGroup}" status updated successfully`)
    } catch (err: any) {
      // Revert on failure
      try {
        lastFetchedRef.current = null
        await fetchSubGroupsAndGroups(debouncedSearch, page)
      } catch (fetchErr) {}
      const msg = err.message || "Failed to update sub group status"
      toast.error(msg)
    }
  }

  // Debounce search query to reset page and delay API fetching
  useEffect(() => {
    // Skip the initial trigger on mount if search is empty to prevent double fetch
    if (search === "" && debouncedSearch === "") return

    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search change
    }, 400)

    return () => clearTimeout(handler)
  }, [search, debouncedSearch])

  // Reactively fetch data when page, limit, or debounced search changes
  useEffect(() => {
    fetchSubGroupsAndGroups(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchSubGroupsAndGroups])

  return {
    subGroups,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchSubGroupsAndGroups(debouncedSearch, page)
    },
    addSubGroup,
    editSubGroup,
    removeSubGroup,
    toggleSubGroupStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}

