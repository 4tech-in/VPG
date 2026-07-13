import { useState, useEffect, useCallback, useRef } from "react"
import { projectService, CreateProjectPayload, ApiProject } from "@/service/projectService"
import { toast } from "sonner"

export type Project = {
  id: string
  name: string
  address: string
  streetAddress: string
  city: string
  state: string
  country: string
  postalCode: string
  startDate: Date
  notes: string
  status: "Active" | "Inactive"
  createdAt: string
  file?: string
}

const mapApiProjectToProject = (apiProject: ApiProject): Project => {
  const id = String(apiProject.id || apiProject._id || "")

  let streetAddress = ""
  let city = ""
  let state = ""
  let country = ""
  let postalCode = ""

  try {
    const parsed = JSON.parse(apiProject.address)
    streetAddress = parsed.streetAddress || ""
    city = parsed.city || ""
    state = parsed.state || ""
    country = parsed.country || ""
    postalCode = parsed.postalCode || ""
  } catch {
    // Fallback if not JSON
    streetAddress = apiProject.address || ""
  }

  return {
    id,
    name: apiProject.projectName,
    address: apiProject.address,
    streetAddress,
    city,
    state,
    country,
    postalCode,
    startDate: apiProject.startDate ? new Date(apiProject.startDate) : new Date(),
    notes: apiProject.notes || "",
    status: apiProject.status === "active" ? "Active" : "Inactive",
    createdAt: apiProject.createdAt ? apiProject.createdAt.split("T")[0] : "",
    file: apiProject.file,
  }
}

export function useProjects(autoFetch = true) {
  const [projects, setProjects] = useState<Project[]>([])
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

  const fetchProjects = useCallback(async (currentSearch = search, currentPage = page) => {
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
      const response = await projectService.getProjects({
        page: currentPage,
        limit,
        search: currentSearch,
      })

      const { projects: rawProjects, pagination: backendPagination } = response
      setProjects(rawProjects.map(mapApiProjectToProject))
      setPagination({
        totalItems: backendPagination.totalItems,
        totalPages: backendPagination.totalPages,
      })
    } catch (err: any) {
      const msg = err.message || "Failed to fetch projects"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search])

  const addProject = async (payload: CreateProjectPayload & { file?: File }) => {
    setIsLoading(true)
    try {
      const newApiProject = await projectService.createProject(payload)
      const newProject = mapApiProjectToProject(newApiProject)
      lastFetchedRef.current = null
      await fetchProjects(debouncedSearch, page)
      toast.success(`Project "${newProject.name}" created successfully`)
      return newProject
    } catch (err: any) {
      const msg = err.message || "Failed to create project"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editProject = async (id: string, payload: Partial<CreateProjectPayload> & { file?: File }) => {
    setIsLoading(true)
    try {
      const updatedApiProject = await projectService.updateProject(id, payload)
      const updatedProject = mapApiProjectToProject(updatedApiProject)
      lastFetchedRef.current = null
      await fetchProjects(debouncedSearch, page)
      toast.success(`Project "${updatedProject.name}" updated successfully`)
      return updatedProject
    } catch (err: any) {
      const msg = err.message || "Failed to update project"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeProject = async (id: string) => {
    setIsLoading(true)
    try {
      await projectService.deleteProject(id)
      lastFetchedRef.current = null
      await fetchProjects(debouncedSearch, page)
      toast.success("Project deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete project"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProjectStatus = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return

    const nextStatus = project.status === "Active" ? "inactive" : "active"

    // Optimistically update local state
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus === "active" ? "Active" : "Inactive" } : p))
    )

    try {
      const updatedApiProject = await projectService.updateProject(id, {
        status: nextStatus,
      })
      const updatedProject = mapApiProjectToProject(updatedApiProject)
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)))
      toast.success(`Project "${updatedProject.name}" status updated successfully`)
    } catch (err: any) {
      try {
        lastFetchedRef.current = null
        await fetchProjects(debouncedSearch, page)
      } catch (fetchErr) {}
      const msg = err.message || "Failed to update project status"
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
    fetchProjects(debouncedSearch, page)
  }, [page, limit, debouncedSearch, fetchProjects, autoFetch])

  const getProjectById = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const apiProject = await projectService.getProjectById(id)
      return mapApiProjectToProject(apiProject)
    } catch (err: any) {
      const msg = err.message || "Failed to fetch project"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    projects,
    isLoading,
    error,
    refetch: () => {
      lastFetchedRef.current = null
      return fetchProjects(debouncedSearch, page)
    },
    addProject,
    editProject,
    removeProject,
    toggleProjectStatus,
    getProjectById,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  }
}
