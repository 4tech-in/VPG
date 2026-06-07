"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Workflow,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/use-tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TasksPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const { tasks, isLoading, removeTask, refetch } = useTasks({ filterStatus: activeFilter });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDeleteTask = async (id: string) => {
    try {
      await removeTask(id);
    } catch (err) { }
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Mission Details",
      cell: ({ row }) => (
        <div className="flex items-center gap-4 py-1">
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              row.original.priority === "urgent" || row.original.priority === "high"
                ? "bg-rose-50 text-rose-500"
                : row.original.priority === "medium"
                  ? "bg-amber-50 text-amber-500"
                  : "bg-emerald-50 text-emerald-500",
            )}
          >
            <Workflow className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-900 truncate max-w-[200px] leading-tight mb-0.5">
              {row.original.title}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest line-clamp-1">
              {row.original.description}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "project",
      header: "Project Node",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent group"
            >
              <div className="flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-900 group-hover:text-primary transition-colors">
                    {row.original.nodeName}
                  </span>
                  <ChevronDown className="h-3 w-3 text-zinc-400 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 p-2 rounded-xl shadow-xl border-zinc-100"
          >
            <DropdownMenuItem
              className="rounded-lg gap-2 cursor-pointer py-2"
            >
              <ExternalLink className="h-4 w-4 text-zinc-400" />
              <span className="font-semibold text-sm">View Node</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === "completed"
                ? "success"
                : "secondary"
            }
            className="rounded-full px-4 py-1 font-bold whitespace-nowrap shadow-sm border-none uppercase"
          >
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignees",
      header: "Team",
      cell: ({ row }) => (
        <div className="flex -space-x-3 overflow-hidden">
          <Avatar
            className="inline-block h-8 w-8 rounded-full ring-2 ring-white shadow-sm"
          >
            <AvatarFallback className="bg-zinc-100 text-[10px] font-bold text-zinc-600">
              {row.original.assignedToName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Timeline",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            {row.original.dueDate || "No Due Date"}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-[1.5rem] shadow-2xl border-zinc-100"
          >
            <DropdownMenuLabel className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 py-2">
              Operations
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="rounded-xl gap-3 cursor-pointer py-2.5"
              onClick={() => router.push(`/tasks/${row.original.id}`)}
            >
              <Eye className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">View Task Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl gap-3 cursor-pointer py-2.5"
              onClick={() => {
                setEditingTask(row.original);
                setIsEditOpen(true);
              }}
            >
              <Edit className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-sm">Edit Mission</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl gap-3 cursor-pointer py-2.5"
              onClick={() => {
                setEditingTask(row.original);
                setIsEditOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4 text-emerald-500" />
              <span className="font-bold text-sm">Assign Members</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-zinc-50" />
            <DropdownMenuItem
              className="rounded-xl gap-3 cursor-pointer py-2.5 text-rose-500 focus:text-rose-500 focus:bg-rose-50"
              onClick={() => handleDeleteTask(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="font-bold text-sm">Delete Task</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredData = tasks;

  return (
    <ContentLayout title="Task Management">
      <div className="flex flex-col gap-10 p-6 sm:p-10 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">
              Tasks
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Operational Command Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <TaskDialog onSuccess={refetch} />
            <TaskDialog
              task={editingTask}
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              onSuccess={refetch}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 p-1.5 bg-zinc-100/50 backdrop-blur-sm w-fit rounded-[1.25rem] border border-zinc-100">
            {["All", "Pending", "in-progress", "Completed", "Cancelled"].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "white" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-xl px-6 h-10 font-bold text-xs transition-all",
                  activeFilter === filter
                    ? "shadow-lg text-primary scale-105"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent",
                )}
                onClick={() => setActiveFilter(filter)}
              >
                {filter.replace("_", " ")}
              </Button>
            ))}
          </div>

          <div className="w-full">
            <DataTable
              columns={columns}
              data={filteredData}
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
            />
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
