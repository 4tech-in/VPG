"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { 
  Edit, 
  Plus, 
  Trash, 
  MoreVertical, 
  Clock 
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectForm } from "@/components/project-form"

type Project = {
  id: number
  name: string
  location: string
  status: "Active" | "Inactive"
  createdAt: string
}

const initialData: Project[] = [
  {
    id: 1,
    name: "Terminal 2 Expansion",
    location: "Mumbai",
    status: "Active",
    createdAt: "2024-03-15",
  },
  {
    id: 2,
    name: "Highway Link Road",
    location: "Pune",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    name: "Smart City Grid",
    location: "Bangalore",
    status: "Inactive",
    createdAt: "2024-01-10",
  },
  {
    id: 4,
    name: "Water Filtration Plant",
    location: "Delhi",
    status: "Active",
    createdAt: "2023-12-05",
  },
  {
    id: 5,
    name: "Metro Phase 4",
    location: "Hyderabad",
    status: "Active",
    createdAt: "2023-11-28",
  },
]

export default function ProjectPage() {
  const [data, setData] = useState<Project[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleStatusToggle = useCallback((id: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    )
  }, [])

  const handleDelete = useCallback((id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingProject(null)
    setIsDialogOpen(true)
  }, [])

  // ... columns definition (kept same as before but ensured it's professional) ...
  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      accessorKey: "id",
      header: () => <div className="text-center w-full">S.No</div>,
      cell: ({ row }) => <div className="text-center w-full font-medium text-zinc-500">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <Link 
          href={`/project/${row.original.id}`}
          className="flex flex-col group cursor-pointer"
        >
          <span className="font-bold text-zinc-900 leading-none mb-1 group-hover:text-primary transition-colors">
            {row.getValue("name")}
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-tighter font-medium">
            Project ID: PRJ-00{row.original.id}
          </span>
        </Link>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <div className="text-zinc-600 font-medium">{row.getValue("location")}</div>,
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center w-full">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <AppleSwitch 
              checked={status === "Active"}
              onCheckedChange={() => handleStatusToggle(row.original.id)}
              size="sm"
            />
            <span className={cn(
              "text-xs font-bold w-[65px] text-center px-2 py-0.5 rounded-full transition-colors",
              status === "Active" ? "text-emerald-700 bg-emerald-50" : "text-zinc-500 bg-zinc-100"
            )}>
              {status}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-zinc-500 font-medium">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{row.getValue("createdAt")}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center w-full">Action</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-destructive hover:bg-destructive/5 transition-all"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ], [handleStatusToggle, handleEdit, handleDelete])

  return (
    <ContentLayout title="Project Management">
      <div className="flex flex-col gap-8 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Project Workspace</h1>
            <p className="text-zinc-500 text-sm font-medium">Manage and monitor all your ongoing infrastructure projects from one central hub.</p>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span className="font-bold">New Project</span>
          </Button>
        </div>



        {/* Table Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h2 className="font-bold text-zinc-800">Recent Projects</h2>
            </div>
          </div>
          <DataTable columns={columns} data={data} searchKey="name" />
        </div>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
            <DialogHeader className="pb-4 border-b border-zinc-100 mb-6">
              <DialogTitle className="text-2xl font-black">{editingProject ? "Edit Project Details" : "Create New Project"}</DialogTitle>
              <DialogDescription className="font-medium text-zinc-500">
                {editingProject 
                  ? "Update the project specifications and status below." 
                  : "Fill in the required details to initialize a new project in the system."}
              </DialogDescription>
            </DialogHeader>
            <ProjectForm 
              onSuccess={() => setIsDialogOpen(false)} 
              initialValues={editingProject ? {
                projectName: editingProject.name,
                status: editingProject.status,
                streetAddress: editingProject.location, 
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}