import { useState, useEffect, useCallback, useRef } from "react"
import { itemService, CreateItemPayload, ApiItem } from "@/service/itemService"
import { toast } from "sonner"

export type Item = {
  id: string
  itemCode: string
  name: string
  specification: string
  unitId: string
  unit: string
  groupId: string
  group: string
  subGroupId: string
  subGroup: string
  price: number
  isBlocked: boolean
  size: string
  info: string
  gst: string
  hsnCode: string
  minLevel: string
  maxLevel: string
  openingLedger: string
  openingPhysical: string
}

const mapApiItemToItem = (apiItem: ApiItem): Item => {
  const id = String(apiItem.id || apiItem._id || "")
  
  let unit = "PCS"
  let unitId = ""
  if (apiItem.unitId && typeof apiItem.unitId === "object") {
    unit = apiItem.unitId.value || apiItem.unitId.label || "PCS"
    unitId = apiItem.unitId._id || ""
  } else if (apiItem.unitId) {
    unitId = String(apiItem.unitId)
  }

  let group = "General"
  let groupId = ""
  if (apiItem.groupId && typeof apiItem.groupId === "object") {
    group = apiItem.groupId.name || "General"
    groupId = apiItem.groupId._id || ""
  } else if (apiItem.groupId) {
    groupId = String(apiItem.groupId)
  }

  let subGroup = ""
  let subGroupId = ""
  if (apiItem.subGroupId && typeof apiItem.subGroupId === "object") {
    subGroup = apiItem.subGroupId.name || ""
    subGroupId = apiItem.subGroupId._id || ""
  } else if (apiItem.subGroupId) {
    subGroupId = String(apiItem.subGroupId)
  }

  return {
    id,
    itemCode: apiItem.itemCode,
    name: apiItem.itemName,
    specification: apiItem.specification || "",
    unitId,
    unit,
    groupId,
    group,
    subGroupId,
    subGroup,
    price: Number(apiItem.price) || 0,
    isBlocked: apiItem.blockItem ?? false,
    size: apiItem.size || "",
    info: apiItem.info || "",
    gst: apiItem.gstPercentage || "",
    hsnCode: apiItem.HSNcode || "",
    minLevel: apiItem.minLevel || "",
    maxLevel: apiItem.maxLevel || "",
    openingLedger: apiItem.openingLedger || "",
    openingPhysical: apiItem.openingPhysical || "",
  }
}

export function useItems(autoFetch = true) {
  const [items, setItems] = useState<Item[]>([])
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

  const fetchItems = useCallback(async (currentSearch = search, currentPage = page) => {
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
      const response = await itemService.getItems({
        page: currentPage,
        limit,
        search: currentSearch,
      })

      const { items: rawItems, pagination: backendPagination } = response
      setItems(rawItems.map(mapApiItemToItem))
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch items"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search])

  const addItem = async (payload: CreateItemPayload) => {
    setIsLoading(true)
    try {
      const newApiItem = await itemService.createItem(payload)
      const newItem = mapApiItemToItem(newApiItem)
      lastFetchedRef.current = null
      await fetchItems(debouncedSearch, page)
      toast.success(`Item "${newItem.name}" created successfully`)
      return newItem
    } catch (err: any) {
      const msg = err.message || "Failed to create item"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editItem = async (id: string, payload: Partial<CreateItemPayload>) => {
    setIsLoading(true)
    try {
      const updatedApiItem = await itemService.updateItem(id, payload)
      const updatedItem = mapApiItemToItem(updatedApiItem)
      lastFetchedRef.current = null
      await fetchItems(debouncedSearch, page)
      toast.success(`Item "${updatedItem.name}" updated successfully`)
      return updatedItem
    } catch (err: any) {
      const msg = err.message || "Failed to update item"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (id: string) => {
    setIsLoading(true)
    try {
      await itemService.deleteItem(id)
      lastFetchedRef.current = null
      await fetchItems(debouncedSearch, page)
      toast.success("Item deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete item"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleItemBlockStatus = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const nextBlocked = !item.isBlocked

    // Optimistically update local state
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isBlocked: nextBlocked } : i))
    )

    try {
      const updatedApiItem = await itemService.updateItem(id, {
        blockItem: nextBlocked,
      })
      const updatedItem = mapApiItemToItem(updatedApiItem)
      setItems((prev) => prev.map((i) => (i.id === id ? updatedItem : i)))
      toast.success(`Item "${updatedItem.name}" status updated successfully`)
    } catch (err: any) {
      try {
        lastFetchedRef.current = null
        await fetchItems(debouncedSearch, page)
      } catch (fetchErr) {}
      const msg = err.message || "Failed to update item block status"
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
    fetchItems(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchItems, autoFetch])

  return {
    items,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchItems(debouncedSearch, page)
    },
    addItem,
    editItem,
    removeItem,
    toggleItemBlockStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
