import { useState, useEffect, useCallback } from "react"
import { outsideService, CreateOutsidePayload, ApiOutside } from "@/service/outsideService"
import { toast } from "sonner"

export type OutsideArea = {
  id: string
  name: string
  note?: string
  projectId: string
  projectName?: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mapApiOutsideToOutsideArea = (apiOutside: ApiOutside): OutsideArea => {
  return {
    id: String(apiOutside.id || apiOutside._id || ""),
    name: apiOutside.outsideName,
    note: apiOutside.outsideNote,
    projectId: typeof apiOutside.projectId === "object" ? apiOutside.projectId?._id : apiOutside.projectId,
    projectName: typeof apiOutside.projectId === "object" ? apiOutside.projectId?.projectName : undefined,
    status: apiOutside.status === "active" ? "Active" : "Inactive",
    createdAt: apiOutside.createdAt ? apiOutside.createdAt.split("T")[0] : "",
  }
}

export function useOutsides(projectId: string, options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [outsides, setOutsides] = useState<OutsideArea[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const fetchOutsides = useCallback(async (params?: { search?: string; page?: number }) => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    const pageToFetch = params?.page ?? page
    const searchToFetch = params?.search ?? search
    try {
      const response = await outsideService.getOutsides({ 
        projectId,
        search: searchToFetch,
        page: pageToFetch,
        limit: 10 
      })
      setOutsides(response.data.map(mapApiOutsideToOutsideArea))
      if (response.pagination) {
        setTotal(response.pagination.total)
        setPageCount(response.pagination.totalPages)
        setPage(response.pagination.page)
      }
    } catch (err: any) {
      const msg = err.message || "Failed to fetch outside areas"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, page, search])

  const addOutside = async (payload: { outsideName: string; outsideNote?: string; status?: "active" | "inactive" }) => {
    setIsLoading(true)
    try {
      const res = await outsideService.createOutside({
        ...payload,
        projectId,
        status: payload.status || "active",
      })
      await fetchOutsides()
      toast.success("Outside area created successfully")
      return mapApiOutsideToOutsideArea(res)
    } catch (err: any) {
      const msg = err.message || "Failed to create outside area"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editOutside = async (id: string, payload: Partial<CreateOutsidePayload>) => {
    setIsLoading(true)
    try {
      const res = await outsideService.updateOutside(id, payload)
      await fetchOutsides()
      toast.success("Outside area updated successfully")
      return mapApiOutsideToOutsideArea(res)
    } catch (err: any) {
      const msg = err.message || "Failed to update outside area"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeOutside = async (id: string) => {
    setIsLoading(true)
    try {
      await outsideService.deleteOutside(id)
      await fetchOutsides()
      toast.success("Outside area deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete outside area"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleOutsideStatus = async (id: string) => {
    const item = outsides.find((o) => o.id === id)
    if (!item) return

    const nextStatus = item.status === "Active" ? "inactive" : "active"

    // Optimistic UI Update
    setOutsides((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus === "active" ? "Active" : "Inactive" } : o))
    )

    try {
      await outsideService.updateOutside(id, {
        status: nextStatus,
      })
      toast.success(`Outside area status updated successfully`)
    } catch (err: any) {
      await fetchOutsides()
      const msg = err.message || "Failed to update outside status"
      toast.error(msg)
    }
  }

  useEffect(() => {
    if (skipFetch) return
    fetchOutsides()
  }, [fetchOutsides, skipFetch])

  return {
    outsides,
    isLoading,
    error,
    refetch: fetchOutsides,
    addOutside,
    editOutside,
    removeOutside,
    toggleOutsideStatus,
    page,
    setPage,
    search,
    setSearch,
    total,
    pageCount,
  }
}
