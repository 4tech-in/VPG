import { useState, useEffect, useCallback, useRef } from "react"
import { vendorService, CreateVendorPayload, ApiVendor } from "@/service/vendorService"
import { toast } from "sonner"

export type Vendor = {
  id: string
  vendorCode: string
  name: string
  companyName: string
  address: string
  city: string
  state: string
  pincode: string
  gstNumber: string
  panNumber: string
  contactPerson: string
  contactNumber: string
  alternateNumber: string
  email: string
  bankName: string
  accountNumber: string
  ifscCode: string
  status: "Active" | "Inactive"
  itemIds: string[]
  items: { id: string; name: string }[]
  createdAt: string
}

const mapApiVendorToVendor = (apiVendor: ApiVendor): Vendor => {
  return {
    id: String(apiVendor.id || apiVendor._id || ""),
    vendorCode: apiVendor.vendorCode,
    name: apiVendor.name,
    companyName: apiVendor.companyName || "",
    address: apiVendor.address || "",
    city: apiVendor.city || "",
    state: apiVendor.state || "",
    pincode: apiVendor.pincode || "",
    gstNumber: apiVendor.gstNumber || "",
    panNumber: apiVendor.panNumber || "",
    contactPerson: apiVendor.contactPerson || "",
    contactNumber: apiVendor.contactNumber,
    alternateNumber: apiVendor.alternateNumber || "",
    email: apiVendor.email || "",
    bankName: apiVendor.bankName || "",
    accountNumber: apiVendor.accountNumber || "",
    ifscCode: apiVendor.ifscCode || "",
    status: apiVendor.status === "active" ? "Active" : "Inactive",
    itemIds: apiVendor.itemIds || [],
    items: (apiVendor.items || []).map(i => ({ id: i._id, name: i.name })),
    createdAt: apiVendor.createdAt ? apiVendor.createdAt.split("T")[0] : "",
  }
}

export function useVendors(autoFetch = true) {
  const [vendors, setVendors] = useState<Vendor[]>([])
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

  const fetchVendors = useCallback(async (currentSearch = search, currentPage = page) => {
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
      const response = await vendorService.getVendors({
        page: currentPage,
        limit,
        search: currentSearch,
      })

      const { vendors: rawVendors, pagination: backendPagination } = response
      setVendors(rawVendors.map(mapApiVendorToVendor))
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch vendors"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search])

  const addVendor = async (payload: CreateVendorPayload) => {
    setIsLoading(true)
    try {
      const newApiVendor = await vendorService.createVendor(payload)
      const newVendor = mapApiVendorToVendor(newApiVendor)
      lastFetchedRef.current = null
      await fetchVendors(debouncedSearch, page)
      toast.success(`Vendor "${newVendor.name}" registered successfully`)
      return newVendor
    } catch (err: any) {
      const msg = err.message || "Failed to create vendor"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editVendor = async (id: string, payload: Partial<CreateVendorPayload>) => {
    setIsLoading(true)
    try {
      const updatedApiVendor = await vendorService.updateVendor(id, payload)
      const updatedVendor = mapApiVendorToVendor(updatedApiVendor)
      lastFetchedRef.current = null
      await fetchVendors(debouncedSearch, page)
      toast.success(`Vendor "${updatedVendor.name}" updated successfully`)
      return updatedVendor
    } catch (err: any) {
      const msg = err.message || "Failed to update vendor"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeVendor = async (id: string) => {
    setIsLoading(true)
    try {
      await vendorService.deleteVendor(id)
      lastFetchedRef.current = null
      await fetchVendors(debouncedSearch, page)
      toast.success("Vendor deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete vendor"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVendorStatus = async (id: string) => {
    const vendor = vendors.find((v) => v.id === id)
    if (!vendor) return

    const nextStatus = vendor.status === "Active" ? "inactive" : "active"

    // Optimistically update local state
    setItems(id, nextStatus === "active" ? "Active" : "Inactive")

    try {
      const updatedApiVendor = await vendorService.updateVendor(id, {
        status: nextStatus,
      })
      const updatedVendor = mapApiVendorToVendor(updatedApiVendor)
      setVendors((prev) => prev.map((v) => (v.id === id ? updatedVendor : v)))
      toast.success(`Vendor "${updatedVendor.name}" status updated successfully`)
    } catch (err: any) {
      try {
        lastFetchedRef.current = null
        await fetchVendors(debouncedSearch, page)
      } catch (fetchErr) {}
      const msg = err.message || "Failed to update vendor status"
      toast.error(msg)
    }
  }

  const setItems = (id: string, newStatus: "Active" | "Inactive") => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    )
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
    fetchVendors(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchVendors, autoFetch])

  return {
    vendors,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchVendors(debouncedSearch, page)
    },
    addVendor,
    editVendor,
    removeVendor,
    toggleVendorStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
