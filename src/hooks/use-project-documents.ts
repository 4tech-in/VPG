import { useState, useEffect, useCallback } from "react"
import { projectDocumentService, CreateProjectDocumentPayload, ApiProjectDocument } from "@/service/projectDocumentService"
import { toast } from "sonner"

export type ProjectDocument = {
  id: string
  title: string
  files: { filePath: string; fileName: string }[]
  note?: string
  projectId: string
  uploadedBy?: string
  createdAt: string
}

const mapApiDocumentToDocument = (apiDoc: ApiProjectDocument): ProjectDocument => {
  return {
    id: String(apiDoc.id || apiDoc._id || ""),
    title: apiDoc.title,
    files: apiDoc.files || [],
    note: apiDoc.note,
    projectId: apiDoc.projectId,
    uploadedBy: apiDoc.uploadedBy,
    createdAt: apiDoc.createdAt ? apiDoc.createdAt.split("T")[0] : "",
  }
}

export function useProjectDocuments(projectId: string, options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch ?? false
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const fetchDocuments = useCallback(async (params?: { search?: string; page?: number }) => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    const pageToFetch = params?.page ?? page
    const searchToFetch = params?.search ?? search
    try {
      const response = await projectDocumentService.getProjectDocuments(projectId, { 
        limit: 10,
        page: pageToFetch,
        search: searchToFetch 
      })
      if (response.data) {
        setDocuments(response.data.map(mapApiDocumentToDocument))
      } else {
        setDocuments([])
      }
      if (response.pagination) {
        setTotal(response.pagination.total)
        setPageCount(response.pagination.totalPages)
        setPage(response.pagination.page)
      }
    } catch (err: any) {
      const msg = err.message || "Failed to fetch documents"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, page, search])

  const addDocument = async (payload: CreateProjectDocumentPayload) => {
    setIsLoading(true)
    try {
      const res = await projectDocumentService.createProjectDocument(projectId, payload)
      await fetchDocuments()
      toast.success("Document created successfully")
      return mapApiDocumentToDocument(res)
    } catch (err: any) {
      const msg = err.message || "Failed to create document"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editDocument = async (id: string, payload: CreateProjectDocumentPayload) => {
    setIsLoading(true)
    try {
      const res = await projectDocumentService.updateProjectDocument(id, payload)
      await fetchDocuments()
      toast.success("Document updated successfully")
      return mapApiDocumentToDocument(res)
    } catch (err: any) {
      const msg = err.message || "Failed to update document"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeDocument = async (id: string) => {
    setIsLoading(true)
    try {
      await projectDocumentService.deleteProjectDocument(id)
      await fetchDocuments()
      toast.success("Document deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete document"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (skipFetch) return
    fetchDocuments()
  }, [fetchDocuments, skipFetch])

  return {
    documents,
    isLoading,
    error,
    refetch: fetchDocuments,
    addDocument,
    editDocument,
    removeDocument,
    page,
    setPage,
    search,
    setSearch,
    total,
    pageCount,
  }
}
