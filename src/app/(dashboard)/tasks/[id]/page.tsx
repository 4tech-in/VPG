"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Edit3,
  Calendar,
  Clock,
  ChevronRight,
  Info,
  Loader2,
  FileText,
  History
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { taskService } from "@/service/taskService";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useProjects } from "@/hooks/use-projects";

export default function TaskDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [task, setTask] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { projects } = useProjects();

  const fetchTaskDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await taskService.getTaskById(params.id);
      setTask(data);
    } catch (err: any) {
      setError(err.message || "Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task record?")) {
      try {
        await taskService.deleteTask(params.id);
        toast.success("Task deleted successfully");
        router.push("/tasks");
      } catch (err) { }
    }
  };

  const handleMarkComplete = async () => {
    try {
      const updated = await taskService.updateTask(params.id, { status: "completed" });
      setTask(updated);
      toast.success("Task marked as completed");
    } catch (err) { }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await taskService.updateTask(params.id, { status: newStatus });
      setTask(updated);
      toast.success(`Task status updated to ${newStatus.replace("_", " ")}`);
    } catch (err) { }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const updated = await taskService.updateTask(params.id, { priority: newPriority });
      setTask(updated);
      toast.success(`Task priority updated to ${newPriority}`);
    } catch (err) { }
  };

  if (isLoading) {
    return (
      <ContentLayout title="Task Details">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 font-bold text-sm">Loading task details...</p>
        </div>
      </ContentLayout>
    );
  }

  if (error || !task) {
    return (
      <ContentLayout title="Task Details">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <p className="text-rose-500 font-bold text-sm">{error || "Task not found."}</p>
          <Link href="/tasks">
            <Button className="rounded-xl px-6 bg-zinc-900 text-white font-bold">Back to Tasks</Button>
          </Link>
        </div>
      </ContentLayout>
    );
  }

  const mappedTaskForDialog = {
    id: task._id || task.id,
    title: task.title,
    description: task.description || "",
    assignedToId: task.assignedToId?._id || task.assignedToId || "",
    assignedToName: task.assignedToId?.name || "Unassigned",
    assignedToMobile: task.assignedToId?.mobile || "",
    createdById: task.createdById?._id || task.createdById || "",
    createdByName: task.createdById?.name || "Unknown",
    nodeId: task.nodeId?._id || task.nodeId || "",
    nodeName: task.nodeId?.name || "Unknown Project",
    projectId: task.projectId?._id || task.projectId || task.nodeId?._id || task.nodeId || "",
    priority: task.priority || "medium",
    status: task.status || "pending",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    completedAt: task.completedAt ? task.completedAt.split("T")[0] : "",
    isActive: task.isActive ?? true,
    createdAt: task.createdAt ? task.createdAt.split("T")[0] : "",
  };

  const project = projects.find(p => p.id === task?.projectId) || projects.find(p => p.id === task?.nodeId);
  const projectName = project ? project.name : (task?.nodeId?.name || "Unknown Project");

  return (
    <ContentLayout title="Task Details">
      <div className="flex flex-col gap-6 p-6 sm:p-10 max-w-[1400px] mx-auto min-h-screen bg-white">
        {/* Breadcrumbs & Actions Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <Link
                href="/tasks"
                className="hover:text-primary transition-colors"
              >
                Tasks
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-900">Task #{mappedTaskForDialog.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/tasks">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-zinc-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Task Details
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-10 rounded-xl border-zinc-200 text-rose-500 font-bold gap-2 hover:bg-rose-50 hover:text-rose-600 transition-all"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            {task.status !== "completed" && (
              <Button
                onClick={handleMarkComplete}
                className="h-10 rounded-xl bg-primary font-bold gap-2 shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark Complete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10 pt-4">
          {/* Main Workspace */}
          <div className="flex flex-col gap-10">
            {/* Title Block */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] uppercase font-bold border",
                    task.priority === "urgent" || task.priority === "high"
                      ? "border-rose-100 bg-rose-50/50 text-rose-600"
                      : task.priority === "medium"
                        ? "border-amber-100 bg-amber-50/50 text-amber-600"
                        : "border-emerald-100 bg-emerald-50/50 text-emerald-600"
                  )}
                >
                  {task.priority}
                </Badge>
                {(task.projectId || task.nodeId) && (
                  <Badge
                    variant="outline"
                    className="rounded-md border-blue-100 bg-blue-50/50 text-blue-600 font-bold px-2 py-0.5 text-[10px] uppercase"
                  >
                    {projectName}
                  </Badge>
                )}
              </div>

              <div className="flex items-start justify-between">
                <h2 className="text-3xl font-bold text-zinc-900 leading-tight">
                  {task.title}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditOpen(true)}
                  className="h-10 w-10 text-zinc-400 hover:text-primary"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Info className="h-3 w-3" /> Description
                </div>
                <p className="text-sm font-medium text-zinc-600 leading-relaxed">
                  {task.description || "No description provided for this task."}
                </p>
              </div>
            </div>

            {/* Collaborative Area */}
            <div className="space-y-6">
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="bg-transparent h-auto p-0 border-b border-zinc-100 w-full justify-start rounded-none gap-8">
                  <TabsTrigger
                    value="history"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-11 px-0 font-bold text-zinc-400 data-[state=active]:text-primary"
                  >
                    Audit Log
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="pt-8 focus-visible:outline-none">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0 text-sm">
                      <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-zinc-300" />
                        <span className="font-medium text-zinc-600">Task created</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-zinc-900">
                          {task.createdById?.name || "System"}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {task.createdAt ? new Date(task.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          }) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-zinc-100 p-6 space-y-8">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 pb-4">
                Operational Data
              </h3>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Status
                  </label>
                  <Select value={task.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-10 rounded-lg bg-zinc-50 border-none text-zinc-600 font-bold text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Priority
                  </label>
                  <Select value={task.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className={cn(
                      "h-10 rounded-lg border-none font-bold text-xs focus:ring-0",
                      task.priority === "urgent" || task.priority === "high"
                        ? "bg-rose-50 text-rose-700"
                        : task.priority === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Assigned Team
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[8px] font-bold">
                            {task.assignedToId?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-zinc-700">
                          {task.assignedToId?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Due Date
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      }) : "No Due Date"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Created
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      }) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskDialog
        task={mappedTaskForDialog}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={fetchTaskDetails}
      />
    </ContentLayout>
  );
}
