"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Trash, MoreVertical } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const handleStatusToggle = (id: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    )
  }

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingProject(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => <div className="font-medium text-zinc-900">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <div className="text-zinc-600">{row.getValue("location")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge 
            variant={status === "Active" ? "success" : "secondary"}
            className="rounded-full px-4 py-1 font-medium"
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => <div className="text-zinc-500 text-xs">{row.getValue("createdAt")}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Action</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100">
                  <MoreVertical className="h-4 w-4 text-zinc-500" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-zinc-100">
                <DropdownMenuItem 
                  onClick={() => handleEdit(row.original)}
                  className="flex items-center gap-2 cursor-pointer focus:bg-zinc-50"
                >
                  <Edit className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusToggle(row.original.id)}
                  className="flex items-center gap-2 cursor-pointer focus:bg-zinc-50"
                >
                  <MoreVertical className="h-4 w-4 rotate-90" /> {row.original.status === "Active" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(row.original.id)}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                >
                  <Trash className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Project">
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Project List</h1>
          <Button variant="default" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
                <DialogDescription>
                  {editingProject 
                    ? "Update the details for the existing project below." 
                    : "Enter the details for the new project below."}
                </DialogDescription>
              </DialogHeader>
              <ProjectForm 
                onSuccess={() => setIsDialogOpen(false)} 
                initialValues={editingProject ? {
                  projectName: editingProject.name,
                  status: editingProject.status,
                  // Note: Initial data only has name/location, 
                  // but form expects more. Mapping location as a hint.
                  streetAddress: editingProject.location, 
                } : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </ContentLayout>
  )
}