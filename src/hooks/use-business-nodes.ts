import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { businessNodeService, ApiBusinessNode, CreateBusinessNodePayload } from "@/service/businessNodes.api"

export type BusinessNode = ApiBusinessNode & {
  id: string
}

export function useBusinessNodes(initialPage = 1, initialLimit = 10, skipFetch = false) {
  const [businessNodes, setBusinessNodes] = useState<BusinessNode[]>([])
  const [isLoading, setIsLoading] = useState(!skipFetch)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  })

  const lastFetchedRef = useRef<string>("")

  const fetchBusinessNodes = useCallback(async (force = false) => {
    if (skipFetch) return

    const paramsKey = JSON.stringify({ page, limit, search })
    if (!force && lastFetchedRef.current === paramsKey) return
    lastFetchedRef.current = paramsKey

    setIsLoading(true)
    try {
      const response = await businessNodeService.getBusinessNodes({
        page: String(page),
        limit: String(limit),
        search: search || "",
      })

      const mapped = response.nodes.map(node => ({
        ...node,
        id: node._id || "",
      })) as BusinessNode[]
      
      setBusinessNodes(mapped)
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          totalItems: response.pagination.totalItems,
          totalPages: response.pagination.totalPages,
        })
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load business nodes")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, skipFetch])

  useEffect(() => {
    fetchBusinessNodes()
  }, [fetchBusinessNodes])

  const addBusinessNode = async (payload: CreateBusinessNodePayload) => {
    try {
      await businessNodeService.createBusinessNode(payload)
      toast.success("Business Node created successfully")
      fetchBusinessNodes(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to create business node")
      throw error
    }
  }

  const editBusinessNode = async (id: string, payload: Partial<CreateBusinessNodePayload> & { isActive?: boolean }) => {
    try {
      await businessNodeService.updateBusinessNode(id, payload)
      toast.success("Business Node updated successfully")
      fetchBusinessNodes(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to update business node")
      throw error
    }
  }

  const removeBusinessNode = async (id: string) => {
    try {
      await businessNodeService.deleteBusinessNode(id)
      toast.success("Business Node deleted successfully")
      fetchBusinessNodes(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete business node")
      throw error
    }
  }

  const toggleBusinessNodeStatus = async (id: string) => {
    try {
      const node = businessNodes.find(n => n.id === id)
      if (!node) return
      
      await businessNodeService.updateBusinessNode(id, { isActive: !node.isActive })
      toast.success(`Business Node ${node.isActive ? "deactivated" : "activated"} successfully`)
      fetchBusinessNodes(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle status")
      throw error
    }
  }

  return {
    businessNodes,
    isLoading,
    fetchBusinessNodes,
    addBusinessNode,
    editBusinessNode,
    removeBusinessNode,
    toggleBusinessNodeStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
