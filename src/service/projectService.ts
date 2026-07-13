import { apiRequest } from "@/lib/api-client"

export type ApiProject = {
  _id?: string
  id?: string
  projectName: string
  address: string
  startDate: string | Date
  notes?: string
  status: "active" | "inactive"
  createdAt?: string
  file?: string
}

export type GetProjectsResponse = {
  projects: ApiProject[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateProjectPayload = {
  projectName: string
  address: string
  startDate: string | Date
  notes?: string
  status: "active" | "inactive"
}

export const projectService = {
  async getProjects(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<GetProjectsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.search) query.append("search", params.search)

    const queryString = query.toString()
    const response = await apiRequest<any>(`projects${queryString ? `?${queryString}` : ""}`)

    if (response && typeof response === "object" && "pagination" in response) {
      const total = response.pagination.total || 0
      const limit = response.pagination.limit || 10
      return {
        projects: response.data || [],
        pagination: {
          page: response.pagination.page || 1,
          limit: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      }
    } else {
      const projects = Array.isArray(response) ? response : response?.data || []
      return {
        projects,
        pagination: {
          page: 1,
          limit: projects.length || 10,
          totalItems: projects.length,
          totalPages: 1,
        },
      }
    }
  },

  async createProject(payload: CreateProjectPayload & { file?: File }): Promise<ApiProject> {
    const formData = new FormData()
    formData.append("projectName", payload.projectName)
    formData.append("address", typeof payload.address === "string" ? payload.address : JSON.stringify(payload.address))
    formData.append("startDate", payload.startDate instanceof Date ? payload.startDate.toISOString() : String(payload.startDate))
    if (payload.notes) formData.append("notes", payload.notes)
    if (payload.status) formData.append("status", payload.status)
    if (payload.file) formData.append("file", payload.file)

    return apiRequest<ApiProject>("projects", {
      method: "POST",
      body: formData,
      isFormData: true,
    })
  },

  async updateProject(id: string, payload: Partial<CreateProjectPayload> & { file?: File }): Promise<ApiProject> {
    const body: any = {
      projectName: payload.projectName,
      notes: payload.notes,
      status: payload.status,
    }

    if (payload.address) {
      body.address = typeof payload.address === "string" ? payload.address : JSON.stringify(payload.address)
    }

    if (payload.startDate) {
      body.startDate = payload.startDate instanceof Date ? payload.startDate.toISOString() : String(payload.startDate)
    }

    return apiRequest<ApiProject>(`projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  },  async getProjectById(id: string): Promise<ApiProject> {
    return apiRequest<ApiProject>(`projects/${id}`)
  },

  async getProjectStructure(projectId: string, params?: { organizationId?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params?.organizationId) query.append("organizationId", params.organizationId)
    const queryString = query.toString()
    return apiRequest<any>(`projects/structure/${projectId}${queryString ? `?${queryString}` : ""}`)
  },

  async deleteProject(id: string): Promise<void> {
    return apiRequest(`projects/${id}`, { method: "DELETE" })
  },

  async bulkAction(action: "block" | "soft-delete" | "export", ids: string[]): Promise<any> {
    return apiRequest<any>("projects/bulk", {
      method: "POST",
      body: JSON.stringify({ action, ids }),
    })
  },
}
