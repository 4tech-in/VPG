import apiClient from "@/lib/api-client"

export type ApiProjectDocument = {
  _id?: string
  id?: string
  title: string
  files: { filePath: string; fileName: string }[]
  note?: string
  projectId: string
  uploadedBy?: string
  createdAt?: string
  updatedAt?: string
}

export type GetProjectDocumentsResponse = {
  success: boolean
  data: ApiProjectDocument[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CreateProjectDocumentPayload = FormData

export const projectDocumentService = {
  async getProjectDocuments(projectId: string, params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<GetProjectDocumentsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)

    const queryString = query.toString()
    return apiClient.get<any, GetProjectDocumentsResponse>(`/projects/documents/${projectId}${queryString ? `?${queryString}` : ""}`)
  },

  async createProjectDocument(projectId: string, payload: CreateProjectDocumentPayload): Promise<ApiProjectDocument> {
    return apiClient.post<any, ApiProjectDocument>(`/projects/documents/${projectId}`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  async updateProjectDocument(id: string, payload: CreateProjectDocumentPayload): Promise<ApiProjectDocument> {
    return apiClient.patch<any, ApiProjectDocument>(`/projects/documents/${id}`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  async deleteProjectDocument(id: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete(`/projects/documents/${id}`)
  },
}
