import { useState, useEffect, useCallback, useRef } from "react"
import { unitService, CreateUnitPayload, ApiUnit } from "@/service/unitService"
import { toast } from "sonner"

export type Unit = {
  id: string
  label: string
  value: string
  status: "Active" | "Inactive"
}

const mapApiUnitToUnit = (apiUnit: ApiUnit): Unit => {
  const id = String(apiUnit.id || apiUnit._id || "")
  const status = apiUnit.status.toLowerCase() === "active" ? "Active" : "Inactive"
  return {
    id,
    label: apiUnit.label,
    value: apiUnit.value,
    status,
  }
}

export function useUnits(autoFetch = true) {
  const [units, setUnits] = useState<Unit[]>([])
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

  const fetchUnits = useCallback(async (currentSearch = search, currentPage = page) => {
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
      const response = await unitService.getUnits({
        page: currentPage,
        limit,
        search: currentSearch,
      })

      const { units: rawUnits, pagination: backendPagination } = response
      setUnits(rawUnits.map(mapApiUnitToUnit))
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch units"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search])

  const addUnit = async (payload: CreateUnitPayload) => {
    setIsLoading(true)
    try {
      const newApiUnit = await unitService.createUnit(payload)
      const newUnit = mapApiUnitToUnit(newApiUnit)
      lastFetchedRef.current = null
      await fetchUnits(debouncedSearch, page)
      toast.success(`Unit "${newUnit.label}" created successfully`)
      return newUnit
    } catch (err: any) {
      const msg = err.message || "Failed to create unit"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editUnit = async (id: string, payload: Partial<CreateUnitPayload>) => {
    setIsLoading(true)
    try {
      const updatedApiUnit = await unitService.updateUnit(id, payload)
      const updatedUnit = mapApiUnitToUnit(updatedApiUnit)
      lastFetchedRef.current = null
      await fetchUnits(debouncedSearch, page)
      toast.success(`Unit "${updatedUnit.label}" updated successfully`)
      return updatedUnit
    } catch (err: any) {
      const msg = err.message || "Failed to update unit"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeUnit = async (id: string) => {
    setIsLoading(true)
    try {
      await unitService.deleteUnit(id)
      lastFetchedRef.current = null
      await fetchUnits(debouncedSearch, page)
      toast.success("Unit deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete unit"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUnitStatus = async (id: string) => {
    const unit = units.find((u) => u.id === id)
    if (!unit) return

    const nextStatus = unit.status === "Active" ? "Inactive" : "Active"

    // Optimistically update local state
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
    )

    try {
      const updatedApiUnit = await unitService.updateUnit(id, {
        status: nextStatus === "Active" ? "active" : "inactive"
      })
      const updatedUnit = mapApiUnitToUnit(updatedApiUnit)
      setUnits((prev) => prev.map((u) => (u.id === id ? updatedUnit : u)))
      toast.success(`Unit "${updatedUnit.label}" status updated successfully`)
    } catch (err: any) {
      try {
        lastFetchedRef.current = null
        await fetchUnits(debouncedSearch, page)
      } catch (fetchErr) {}
      const msg = err.message || "Failed to update unit status"
      toast.error(msg)
    }
  }

  // Debounce search query
  useEffect(() => {
    if (!autoFetch) return
    if (search === "" && debouncedSearch === "") return

    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)

    return () => clearTimeout(handler)
  }, [search, debouncedSearch, autoFetch])

  // Reactively fetch data
  useEffect(() => {
    if (!autoFetch) return
    fetchUnits(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchUnits, autoFetch])

  return {
    units,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchUnits(debouncedSearch, page)
    },
    addUnit,
    editUnit,
    removeUnit,
    toggleUnitStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
