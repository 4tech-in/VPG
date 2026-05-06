"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Trash } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
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

  const handleStatusToggle = (id: number) => {
    setTimeout(() => {
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
            : item
        )
      )
    }, 300)
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
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex justify-center">
            <AppleSwitch
              checked={status === "Active"}
              onCheckedChange={() => handleStatusToggle(row.original.id)}
              size="sm"
            />
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        return (
          <div className="flex justify-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
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
        <DataTable columns={columns} data={data} />
      </div>
    </ContentLayout>
  )
}