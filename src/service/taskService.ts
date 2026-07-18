import { apiRequest } from "@/lib/api-client"

export type ApiTask = {
  id?: string
  _id?: string
  organizationId: string
  nodeId?: any
  title: string
  description?: string
  assignedToId: any
  createdById: any
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "review" | "completed" | "cancelled"
  dueDate?: string
  completedAt?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type GetTasksResponse = {
  success: boolean
  data: ApiTask[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export type CreateTaskPayload = {
  title: string
  description?: string
  assignedToId: string
  projectId: string
  priority?: string
  dueDate?: string
}

export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
  status?: string
}

export const taskService = {
  async getTasks(params?: Record<string, any>): Promise<GetTasksResponse> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    const response = await apiRequest<any>(`task${queryString ? `?${queryString}` : ""}`)
    
    if (response && response.success && response.data) {
      return response as GetTasksResponse;
    }
    // Fallback if structure differs
    const tasks = Array.isArray(response) ? response : (response?.data || [])
    return {
      success: true,
      data: tasks,
      pagination: response?.pagination || {
        page: 1,
        limit: tasks.length || 10,
        totalItems: tasks.length,
        totalPages: 1
      }
    }
  },

  async getTaskById(id: string): Promise<ApiTask> {
    const response = await apiRequest<any>(`task/${id}`)
    return response?.data || response
  },

  async createTask(payload: CreateTaskPayload): Promise<ApiTask> {
    const response = await apiRequest<any>("task", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response?.data || response
  },

  async updateTask(id: string, payload: UpdateTaskPayload): Promise<ApiTask> {
    const response = await apiRequest<any>(`task/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return response?.data || response
  },

  async deleteTask(id: string): Promise<void> {
    return apiRequest(`task/${id}`, { method: "DELETE" })
  },
}
