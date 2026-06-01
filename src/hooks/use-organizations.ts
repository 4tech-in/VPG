import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { organizationService, CreateOrganizationPayload, ApiOrganization } from "@/service/organizationService"
import { toast } from "sonner"

export type Organization = {
  id: string
  name: string
  industryType: string
  email: string
  mobile: string
  address: string
  isActive: boolean
  status: "Active" | "Inactive"
}

const mapApiOrganizationToOrganization = (apiOrg: ApiOrganization): Organization => {
  const id = String(apiOrg.id || apiOrg._id || "")
  return {
    id,
    name: apiOrg.name,
    industryType: apiOrg.industryType || "",
    email: apiOrg.email || "",
    mobile: apiOrg.mobile || "",
    address: apiOrg.address || "",
    isActive: apiOrg.isActive ?? true,
    status: apiOrg.isActive ? "Active" : "Inactive",
  }
}

export function useOrganizations(options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await organizationService.getOrganizations()
      setAllOrganizations(response.organizations.map(mapApiOrganizationToOrganization))
    } catch (err: any) {
      const msg = err.message || "Failed to fetch organizations"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addOrganization = async (payload: CreateOrganizationPayload) => {
    setIsLoading(true)
    try {
      const newApiOrg = await organizationService.createOrganization(payload)
      const newOrg = mapApiOrganizationToOrganization(newApiOrg)
      await fetchOrganizations()
      toast.success(`Organization "${newOrg.name}" created successfully`)
      return newOrg
    } catch (err: any) {
      const msg = err.message || "Failed to create organization"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editOrganization = async (id: string, payload: Partial<CreateOrganizationPayload>) => {
    setIsLoading(true)
    try {
      const updatedApiOrg = await organizationService.updateOrganization(id, payload)
      const updatedOrg = mapApiOrganizationToOrganization(updatedApiOrg)
      await fetchOrganizations()
      toast.success(`Organization "${updatedOrg.name}" updated successfully`)
      return updatedOrg
    } catch (err: any) {
      const msg = err.message || "Failed to update organization"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeOrganization = async (id: string) => {
    setIsLoading(true)
    try {
      await organizationService.deleteOrganization(id)
      await fetchOrganizations()
      toast.success("Organization deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete organization"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleOrganizationStatus = async (id: string) => {
    const org = allOrganizations.find((o) => o.id === id)
    if (!org) return

    const nextIsActive = !org.isActive

    // Optimistically update local state for instantaneous toggle animation
    setAllOrganizations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive: nextIsActive, status: nextIsActive ? "Active" : "Inactive" } : o))
    )

    try {
      const updatedApiOrg = await organizationService.updateOrganization(id, {
        isActive: nextIsActive
      })
      const updatedOrg = mapApiOrganizationToOrganization(updatedApiOrg)
      setAllOrganizations((prev) => prev.map((o) => (o.id === id ? updatedOrg : o)))
      toast.success(`Organization "${updatedOrg.name}" status updated successfully`)
    } catch (err: any) {
      await fetchOrganizations()
      const msg = err.message || "Failed to update organization status"
      toast.error(msg)
    }
  }

  // Client-side search and pagination
  const filteredOrganizations = useMemo(() => {
    if (!search) return allOrganizations
    const query = search.toLowerCase()
    return allOrganizations.filter(
      (o) =>
        o.name.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query) ||
        o.industryType.toLowerCase().includes(query)
    )
  }, [allOrganizations, search])

  const paginatedOrganizations = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredOrganizations.slice(startIndex, startIndex + limit)
  }, [filteredOrganizations, page, limit])

  const pagination = useMemo(() => {
    const totalItems = filteredOrganizations.length
    const totalPages = Math.ceil(totalItems / limit) || 1
    return {
      totalItems,
      totalPages,
    }
  }, [filteredOrganizations, limit])

  const calledRef = useRef(false)

  // Fetch on mount
  useEffect(() => {
    if (skipFetch) return
    if (calledRef.current) return
    calledRef.current = true
    fetchOrganizations()
  }, [fetchOrganizations, skipFetch])

  return {
    organizations: paginatedOrganizations,
    allOrganizations,
    isLoading,
    error,
    refetch: fetchOrganizations,
    addOrganization,
    editOrganization,
    removeOrganization,
    toggleOrganizationStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
