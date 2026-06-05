import { useState, useCallback, useEffect, useRef } from "react"
import { advanceService, ApiAdvance } from "@/service/advances.api"
import { toast } from "sonner"

export type Advance = ApiAdvance & {
  id: string
}

export function useAdvances(initialPage = 1, initialLimit = 10, skipFetch = false) {
  const [advances, setAdvances] = useState<Advance[]>([])
  const [isLoading, setIsLoading] = useState(!skipFetch)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  })

  const lastFetchedRef = useRef<string>("")

  const fetchAdvances = useCallback(async (force = false) => {
    if (skipFetch) return

    const paramsKey = JSON.stringify({ page, limit, search, status, userId })
    if (!force && lastFetchedRef.current === paramsKey) return
    lastFetchedRef.current = paramsKey

    setIsLoading(true)
    try {
      const response = await advanceService.getAdvances({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        userId: userId || undefined,
      })

      const rawAdvances = response.data || []
      const mapped = rawAdvances.map((adv: any) => ({
        ...adv,
        id: adv._id || "",
      })) as Advance[]

      setAdvances(mapped)
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          totalItems: response.pagination.total,
          totalPages: response.pagination.totalPages,
        })
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load advances")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, status, userId, skipFetch])

  useEffect(() => {
    fetchAdvances()
  }, [fetchAdvances])

  const addAdvance = async (payload: { userId: string; amount: number; reason: string; note?: string; advanceDate?: string }) => {
    try {
      setIsLoading(true)
      await advanceService.createAdvance(payload)
      toast.success("Advance created successfully")
      fetchAdvances(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to create advance")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const editAdvance = async (id: string, payload: { amount?: number; reason?: string; note?: string; advanceDate?: string }) => {
    try {
      setIsLoading(true)
      await advanceService.updateAdvance(id, payload)
      toast.success("Advance updated successfully")
      fetchAdvances(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to update advance")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const settleAdvance = async (id: string) => {
    try {
      setIsLoading(true)
      await advanceService.settleAdvance(id)
      toast.success("Advance settled successfully")
      fetchAdvances(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to settle advance")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const cancelAdvance = async (id: string) => {
    try {
      setIsLoading(true)
      await advanceService.cancelAdvance(id)
      toast.success("Advance cancelled successfully")
      fetchAdvances(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel advance")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const removeAdvance = async (id: string) => {
    try {
      setIsLoading(true)
      await advanceService.deleteAdvance(id)
      toast.success("Advance deleted successfully")
      fetchAdvances(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete advance")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    advances,
    isLoading,
    fetchAdvances,
    addAdvance,
    editAdvance,
    settleAdvance,
    cancelAdvance,
    removeAdvance,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    status,
    setStatus,
    userId,
    setUserId,
    pagination,
  }
}
