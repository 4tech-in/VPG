import { useState, useEffect, useCallback, useRef } from "react"
import { geofenceService, CreateGeofencePayload, ApiGeofence } from "@/service/geofenceService"
import { toast } from "sonner"

export type Geofence = {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  address?: string
  status?: string
}

const mapApiGeofenceToGeofence = (apiGeofence: ApiGeofence): Geofence => {
  return {
    id: String(apiGeofence.id || apiGeofence._id || ""),
    name: apiGeofence.name,
    latitude: Number(apiGeofence.latitude),
    longitude: Number(apiGeofence.longitude),
    radius: Number(apiGeofence.radiusInMeters),
    address: apiGeofence.address || "",
    status: apiGeofence.status || "active",
  }
}

export function useGeofences(autoFetch = true) {
  const [geofences, setGeofences] = useState<Geofence[]>([])
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

  const fetchGeofences = useCallback(async (currentSearch = search, currentPage = page) => {
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
      const response = await geofenceService.getGeofences({
        page: currentPage,
        limit,
        search: currentSearch,
      })

      const { geofences: rawGeofences, pagination: backendPagination } = response
      setGeofences(rawGeofences.map(mapApiGeofenceToGeofence))
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch geofences"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search])

  const addGeofence = async (payload: CreateGeofencePayload) => {
    setIsLoading(true)
    try {
      const newApiGeofence = await geofenceService.createGeofence(payload)
      const newGeofence = mapApiGeofenceToGeofence(newApiGeofence)
      lastFetchedRef.current = null
      await fetchGeofences(debouncedSearch, page)
      toast.success(`Geofence "${newGeofence.name}" created successfully`)
      return newGeofence
    } catch (err: any) {
      const msg = err.message || "Failed to create geofence"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editGeofence = async (id: string, payload: Partial<CreateGeofencePayload>) => {
    setIsLoading(true)
    try {
      const updatedApiGeofence = await geofenceService.updateGeofence(id, payload)
      const updatedGeofence = mapApiGeofenceToGeofence(updatedApiGeofence)
      lastFetchedRef.current = null
      await fetchGeofences(debouncedSearch, page)
      toast.success(`Geofence "${updatedGeofence.name}" updated successfully`)
      return updatedGeofence
    } catch (err: any) {
      const msg = err.message || "Failed to update geofence"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeGeofence = async (id: string) => {
    setIsLoading(true)
    try {
      await geofenceService.deleteGeofence(id)
      lastFetchedRef.current = null
      await fetchGeofences(debouncedSearch, page)
      toast.success("Geofence deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete geofence"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
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
    fetchGeofences(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchGeofences, autoFetch])

  return {
    geofences,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchGeofences(debouncedSearch, page)
    },
    addGeofence,
    editGeofence,
    removeGeofence,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
