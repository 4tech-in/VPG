"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { 
  Edit, 
  Trash, 
  Clock 
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectForm } from "@/components/project-form"
import { useProjects, Project } from "@/hooks/use-projects"
import { projectService } from "@/service/projectService"
import { toast } from "sonner"

export default function ProjectPage() {
  const {
    projects,
    isLoading,
    addProject,
    editProject,
    removeProject,
    toggleProjectStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
    refetch,
  } = useProjects()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleProjectStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleProjectStatus])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeProject(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeProject])

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingProject(null)
    setIsDialogOpen(true)
  }, [])

  const handleSave = async (payload: any) => {
    try {
      if (editingProject) {
        await editProject(editingProject.id, payload)
      } else {
        await addProject(payload)
      }
      setIsDialogOpen(false)
    } catch (error) {
      throw error
    }
  }

  const handleBulkAction = async (action: "block" | "soft-delete" | "export") => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    if (selectedIds.length === 0) return;
    
    try {
      if (action === "export") {
        const data = await projectService.bulkAction(action, selectedIds);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `projects-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Projects exported successfully");
      } else {
        await projectService.bulkAction(action, selectedIds);
        toast.success(`Bulk action '${action}' completed successfully`);
        setRowSelection({});
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk action failed");
    }
  };

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: () => <div className="text-center w-full">S.No</div>,
      cell: ({ row }) => (
        <div className="text-center w-full font-medium text-zinc-500">
          {row.index + 1 + (page - 1) * limit}
        </div>
      ),
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
            Project ID: {row.original.id.substring(0, 8).toUpperCase()}
          </span>
        </Link>
      ),
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => (
        <div className="text-zinc-600 font-medium">
          {row.original.city ? `${row.original.city}, ${row.original.state}` : row.original.streetAddress || "N/A"}
        </div>
      ),
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
  ], [handleStatusToggle, handleEdit, handleDelete, page, limit])

  return (
    <ContentLayout title="Project Management">
      <div className="flex flex-col gap-8 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Project Workspace</h1>
            <p className="text-zinc-500 text-sm font-medium">Manage and monitor all your ongoing projects from one central hub.</p>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="font-bold">New Project</span>
          </Button>
        </div>

        {/* Table Section */}
        <DataTable 
          columns={columns} 
          data={projects} 
          searchKey="name" 
          isServerSide={true}
          pageIndex={page - 1}
          pageSize={limit}
          pageCount={pagination.totalPages}
          totalItems={pagination.totalItems}
          searchValue={search}
          onSearchChange={setSearch}
          onPageChange={(p) => setPage(p + 1)}
          onPageSizeChange={(size) => setLimit(size)}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />

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
            {isDialogOpen && (
              <ProjectForm 
                onSuccess={() => setIsDialogOpen(false)} 
                onSubmit={handleSave}
                initialValues={editingProject ? {
                  projectName: editingProject.name,
                  streetAddress: editingProject.streetAddress,
                  country: editingProject.country,
                  state: editingProject.state,
                  city: editingProject.city,
                  postalCode: editingProject.postalCode,
                  status: editingProject.status,
                  projectNotes: editingProject.notes,
                  startDate: editingProject.startDate,
                  file: editingProject.file,
                } : undefined}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Floating Bulk Actions Bar */}
        {Object.keys(rowSelection).filter(id => rowSelection[id]).length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span className="text-sm font-bold text-zinc-600">
              <span className="text-primary font-black">{Object.keys(rowSelection).filter(id => rowSelection[id]).length}</span> selected
            </span>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("block")}
                className="h-9 px-4 rounded-xl font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                Block
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("soft-delete")}
                className="h-9 px-4 rounded-xl font-bold border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                Delete
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleBulkAction("export")}
                className="h-9 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/95"
              >
                Export
              </Button>
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  )
}