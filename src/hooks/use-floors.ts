import { useState, useEffect, useCallback } from "react"
import { floorService, CreateFloorPayload, ApiFloor } from "@/service/floorService"
import { toast } from "sonner"

export type Floor = {
  id: string
  name: string
  number: number
  towerId: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mapApiFloorToFloor = (apiFloor: ApiFloor): Floor => {
  return {
    id: String(apiFloor.id || apiFloor._id || ""),
    name: apiFloor.floorName,
    number: Number(apiFloor.floorNumber || 0),
    towerId: typeof apiFloor.towerId === "object" ? apiFloor.towerId?._id : apiFloor.towerId,
    status: apiFloor.status === "active" ? "Active" : "Inactive",
    createdAt: apiFloor.createdAt ? apiFloor.createdAt.split("T")[0] : "",
  }
}

export function useFloors(towerId: string, options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [floors, setFloors] = useState<Floor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const fetchFloors = useCallback(async (params?: { search?: string; page?: number }) => {
    if (!towerId) return
    setIsLoading(true)
    setError(null)
    const pageToFetch = params?.page ?? page
    const searchToFetch = params?.search ?? search
    try {
      const response = await floorService.getFloors({ 
        towerId, 
        limit: 10,
        page: pageToFetch,
        search: searchToFetch 
      })
      setFloors(response.data.map(mapApiFloorToFloor))
      if (response.pagination) {
        setTotal(response.pagination.total)
        setPageCount(response.pagination.totalPages)
        setPage(response.pagination.page)
      }
    } catch (err: any) {
      const msg = err.message || "Failed to fetch floors"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [towerId, page, search])

  const addFloor = async (payload: { floorName: string; floorNumber: number; status?: "active" | "inactive" }) => {
    setIsLoading(true)
    try {
      const res = await floorService.createFloor({
        ...payload,
        floorNumber: String(payload.floorNumber),
        towerId,
        status: payload.status || "active",
      })
      await fetchFloors()
      toast.success("Floor created successfully")
      return mapApiFloorToFloor(res)
    } catch (err: any) {
      const msg = err.message || "Failed to create floor"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editFloor = async (id: string, payload: Partial<CreateFloorPayload>) => {
    setIsLoading(true)
    try {
      const res = await floorService.updateFloor(id, payload)
      await fetchFloors()
      toast.success("Floor updated successfully")
      return mapApiFloorToFloor(res)
    } catch (err: any) {
      const msg = err.message || "Failed to update floor"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeFloor = async (id: string) => {
    setIsLoading(true)
    try {
      await floorService.deleteFloor(id)
      await fetchFloors()
      toast.success("Floor deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete floor"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFloorStatus = async (id: string) => {
    const floor = floors.find((f) => f.id === id)
    if (!floor) return

    const nextStatus = floor.status === "Active" ? "inactive" : "active"

    // Optimistic UI Update
    setFloors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: nextStatus === "active" ? "Active" : "Inactive" } : f))
    )

    try {
      await floorService.updateFloor(id, {
        status: nextStatus,
      })
      toast.success(`Floor status updated successfully`)
    } catch (err: any) {
      await fetchFloors()
      const msg = err.message || "Failed to update floor status"
      toast.error(msg)
    }
  }

  useEffect(() => {
    if (skipFetch) return
    fetchFloors()
  }, [fetchFloors, skipFetch])

  return {
    floors,
    isLoading,
    error,
    refetch: fetchFloors,
    addFloor,
    editFloor,
    removeFloor,
    toggleFloorStatus,
    page,
    setPage,
    search,
    setSearch,
    total,
    pageCount,
  }
}
