import { useState, useEffect, useCallback } from "react"
import { towerService, CreateTowerPayload, ApiTower } from "@/service/towerService"
import { toast } from "sonner"

export type Tower = {
  id: string
  name: string
  number: string
  projectId: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mapApiTowerToTower = (apiTower: ApiTower): Tower => {
  return {
    id: String(apiTower.id || apiTower._id || ""),
    name: apiTower.towerName,
    number: apiTower.towerNumber,
    projectId: apiTower.projectId,
    status: apiTower.status === "active" ? "Active" : "Inactive",
    createdAt: apiTower.createdAt ? apiTower.createdAt.split("T")[0] : "",
  }
}

export function useTowers(projectId: string, options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [towers, setTowers] = useState<Tower[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const fetchTowers = useCallback(async (params?: { search?: string; page?: number }) => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    const pageToFetch = params?.page ?? page
    const searchToFetch = params?.search ?? search
    try {
      const response = await towerService.getTowers({ 
        projectId, 
        limit: 10,
        page: pageToFetch,
        search: searchToFetch 
      })
      setTowers(response.data.map(mapApiTowerToTower))
      if (response.pagination) {
        setTotal(response.pagination.total)
        setPageCount(response.pagination.totalPages)
        setPage(response.pagination.page)
      }
    } catch (err: any) {
      const msg = err.message || "Failed to fetch towers"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, page, search])

  const addTower = async (payload: { towerName: string; towerNumber: string; status?: "active" | "inactive" }) => {
    setIsLoading(true)
    try {
      const res = await towerService.createTower({
        ...payload,
        projectId,
        status: payload.status || "active",
      })
      await fetchTowers()
      toast.success("Tower created successfully")
      return mapApiTowerToTower(res)
    } catch (err: any) {
      const msg = err.message || "Failed to create tower"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editTower = async (id: string, payload: Partial<CreateTowerPayload>) => {
    setIsLoading(true)
    try {
      const res = await towerService.updateTower(id, payload)
      await fetchTowers()
      toast.success("Tower updated successfully")
      return mapApiTowerToTower(res)
    } catch (err: any) {
      const msg = err.message || "Failed to update tower"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeTower = async (id: string) => {
    setIsLoading(true)
    try {
      await towerService.deleteTower(id)
      await fetchTowers()
      toast.success("Tower deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete tower"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTowerStatus = async (id: string) => {
    const tower = towers.find((t) => t.id === id)
    if (!tower) return

    const nextStatus = tower.status === "Active" ? "inactive" : "active"

    // Optimistic UI Update
    setTowers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus === "active" ? "Active" : "Inactive" } : t))
    )

    try {
      await towerService.updateTower(id, {
        status: nextStatus,
      })
      toast.success(`Tower status updated successfully`)
    } catch (err: any) {
      await fetchTowers()
      const msg = err.message || "Failed to update tower status"
      toast.error(msg)
    }
  }

  useEffect(() => {
    if (skipFetch) return
    fetchTowers()
  }, [fetchTowers, skipFetch])

  return {
    towers,
    isLoading,
    error,
    refetch: fetchTowers,
    addTower,
    editTower,
    removeTower,
    toggleTowerStatus,
    page,
    setPage,
    search,
    setSearch,
    total,
    pageCount,
  }
}
