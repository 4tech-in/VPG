import { useState, useEffect, useCallback } from "react"
import { flatService, CreateFlatPayload, ApiFlat } from "@/service/flatService"
import { toast } from "sonner"

export type Flat = {
  id: string
  name: string
  number: string
  floorId: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mapApiFlatToFlat = (apiFlat: ApiFlat): Flat => {
  return {
    id: String(apiFlat.id || apiFlat._id || ""),
    name: apiFlat.flatName,
    number: String(apiFlat.flatNumber),
    floorId: typeof apiFlat.floorId === "object" ? apiFlat.floorId?._id : apiFlat.floorId,
    status: apiFlat.status === "active" ? "Active" : "Inactive",
    createdAt: apiFlat.createdAt ? apiFlat.createdAt.split("T")[0] : "",
  }
}

export function useFlats(floorId: string, options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [flats, setFlats] = useState<Flat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const fetchFlats = useCallback(async (params?: { search?: string; page?: number }) => {
    if (!floorId) return
    setIsLoading(true)
    setError(null)
    const pageToFetch = params?.page ?? page
    const searchToFetch = params?.search ?? search
    try {
      const response = await flatService.getFlats({ 
        floorId, 
        limit: 10,
        page: pageToFetch,
        search: searchToFetch 
      })
      setFlats(response.data.map(mapApiFlatToFlat))
      if (response.pagination) {
        setTotal(response.pagination.total)
        setPageCount(response.pagination.totalPages)
        setPage(response.pagination.page)
      }
    } catch (err: any) {
      const msg = err.message || "Failed to fetch flats"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [floorId, page, search])

  const addFlat = async (payload: { flatName: string; flatNumber: string | number; status?: "active" | "inactive" }) => {
    setIsLoading(true)
    try {
      const res = await flatService.createFlat({
        ...payload,
        flatNumber: String(payload.flatNumber),
        floorId,
        status: payload.status || "active",
      })
      await fetchFlats()
      toast.success("Flat created successfully")
      return mapApiFlatToFlat(res)
    } catch (err: any) {
      const msg = err.message || "Failed to create flat"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editFlat = async (id: string, payload: Partial<CreateFlatPayload>) => {
    setIsLoading(true)
    try {
      const res = await flatService.updateFlat(id, payload)
      await fetchFlats()
      toast.success("Flat updated successfully")
      return mapApiFlatToFlat(res)
    } catch (err: any) {
      const msg = err.message || "Failed to update flat"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeFlat = async (id: string) => {
    setIsLoading(true)
    try {
      await flatService.deleteFlat(id)
      await fetchFlats()
      toast.success("Flat deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete flat"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFlatStatus = async (id: string) => {
    const flat = flats.find((f) => f.id === id)
    if (!flat) return

    const nextStatus = flat.status === "Active" ? "inactive" : "active"

    // Optimistic UI Update
    setFlats((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: nextStatus === "active" ? "Active" : "Inactive" } : f))
    )

    try {
      await flatService.updateFlat(id, {
        status: nextStatus,
      })
      toast.success(`Flat status updated successfully`)
    } catch (err: any) {
      await fetchFlats()
      const msg = err.message || "Failed to update flat status"
      toast.error(msg)
    }
  }

  useEffect(() => {
    if (skipFetch) return
    fetchFlats()
  }, [fetchFlats, skipFetch])

  return {
    flats,
    isLoading,
    error,
    refetch: fetchFlats,
    addFlat,
    editFlat,
    removeFlat,
    toggleFlatStatus,
    page,
    setPage,
    search,
    setSearch,
    total,
    pageCount,
  }
}
