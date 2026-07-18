import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { taskService, CreateTaskPayload, UpdateTaskPayload, ApiTask } from "@/service/taskService"
import { toast } from "sonner"

export type Task = {
  id: string
  title: string
  description: string
  assignedToId: string
  assignedToName: string
  assignedToMobile: string
  createdById: string
  createdByName: string
  nodeId: string
  nodeName: string
  projectId: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "review" | "completed" | "cancelled"
  dueDate: string
  completedAt: string
  isActive: boolean
  createdAt: string
}

const mapApiTaskToTask = (apiTask: ApiTask & { projectId?: any }): Task => {
  const id = String(apiTask.id || apiTask._id || "")
  return {
    id,
    title: apiTask.title,
    description: apiTask.description || "",
    assignedToId: apiTask.assignedToId?._id || apiTask.assignedToId || "",
    assignedToName: apiTask.assignedToId?.name || "Unassigned",
    assignedToMobile: apiTask.assignedToId?.mobile || "",
    createdById: apiTask.createdById?._id || apiTask.createdById || "",
    createdByName: apiTask.createdById?.name || "Unknown",
    nodeId: apiTask.nodeId?._id || apiTask.nodeId || "",
    nodeName: apiTask.nodeId?.name || "Unknown Project",
    projectId: apiTask.projectId?._id || apiTask.projectId || apiTask.nodeId?._id || apiTask.nodeId || "",
    priority: apiTask.priority || "medium",
    status: apiTask.status || "pending",
    dueDate: apiTask.dueDate ? apiTask.dueDate.split("T")[0] : "",
    completedAt: apiTask.completedAt ? apiTask.completedAt.split("T")[0] : "",
    isActive: apiTask.isActive ?? true,
    createdAt: apiTask.createdAt ? apiTask.createdAt.split("T")[0] : "",
  }
}

export function useTasks(options?: { skipFetch?: boolean; filterStatus?: string }) {
  const skipFetch = options?.skipFetch ?? false
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, limit }
      if (search) params.search = search
      if (options?.filterStatus && options.filterStatus !== "All") {
        params.status = options.filterStatus.toLowerCase()
      }
      
      const response = await taskService.getTasks(params)
      setAllTasks(response.data.map(mapApiTaskToTask))
    } catch (err: any) {
      const msg = err.message || "Failed to fetch tasks"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, options?.filterStatus])

  const addTask = async (payload: CreateTaskPayload) => {
    setIsLoading(true)
    try {
      const newApiTask = await taskService.createTask(payload)
      const newTask = mapApiTaskToTask(newApiTask)
      await fetchTasks()
      toast.success(`Task "${newTask.title}" created successfully`)
      return newTask
    } catch (err: any) {
      const msg = err.message || "Failed to create task"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const editTask = async (id: string, payload: UpdateTaskPayload) => {
    setIsLoading(true)
    try {
      const updatedApiTask = await taskService.updateTask(id, payload)
      const updatedTask = mapApiTaskToTask(updatedApiTask)
      await fetchTasks()
      toast.success(`Task "${updatedTask.title}" updated successfully`)
      return updatedTask
    } catch (err: any) {
      const msg = err.message || "Failed to update task"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeTask = async (id: string) => {
    setIsLoading(true)
    try {
      await taskService.deleteTask(id)
      await fetchTasks()
      toast.success("Task deleted successfully")
    } catch (err: any) {
      const msg = err.message || "Failed to delete task"
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const calledRef = useRef(false)

  // Fetch on mount or when dependencies change
  useEffect(() => {
    if (skipFetch) return
    fetchTasks()
  }, [fetchTasks, skipFetch])

  return {
    tasks: allTasks,
    isLoading,
    error,
    refetch: fetchTasks,
    addTask,
    editTask,
    removeTask,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
  }
}
