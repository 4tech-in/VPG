"use client"

import { useState, useMemo, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Trash } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GroupForm } from "@/components/group-form"
import { useGroups, Group } from "@/hooks/use-groups"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { cn } from "@/lib/utils"

export default function GroupPage() {
  const { 
    groups, 
    addGroup, 
    editGroup, 
    removeGroup, 
    toggleGroupStatus,
    page,
    setPage,
    limit,
    search,
    setSearch,
    pagination,
  } = useGroups()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleGroupStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleGroupStatus])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeGroup(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeGroup])

  const handleEdit = useCallback((group: Group) => {
    setEditingGroup(group)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingGroup(null)
    setIsDialogOpen(true)
  }, [])

  const handleSave = async (values: { name: string; status: string }) => {
    try {
      if (editingGroup) {
        // Status is omitted during edit saves to prevent status override
        await editGroup(editingGroup.id, {
          name: values.name,
        })
      } else {
        await addGroup({
          name: values.name,
          status: values.status === "Active" ? "active" : "inactive",
        })
      }
    } catch (error) {
      throw error
    }
  }

  const columns = useMemo<ColumnDef<Group>[]>(() => [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1 + (page - 1) * limit}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="pl-2 font-medium text-zinc-900">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
            <AppleSwitch
              checked={status === "Active"}
              onCheckedChange={() => handleStatusToggle(row.original.id)}
              size="sm"
            />
            <span className={cn(
              "text-xs font-bold min-w-[65px] px-2 py-0.5 rounded-full transition-colors text-center",
              status === "Active" ? "text-emerald-700 bg-emerald-50" : "text-zinc-500 bg-zinc-100"
            )}>
              {status}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="pl-2">Action</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-start gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-zinc-700 hover:text-zinc-950 border-zinc-200 hover:bg-zinc-50 rounded-lg transition-all duration-200"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-zinc-200 hover:border-destructive/20 rounded-lg transition-all duration-200"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ], [handleStatusToggle, handleEdit, handleDelete, page, limit])

  return (
    <ContentLayout title="Group">
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Group List</h1>
          <Button variant="default" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Group
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingGroup ? "Edit Group" : "Add New Group"}</DialogTitle>
                <DialogDescription>
                  {editingGroup 
                    ? "Update the details for the existing group." 
                    : "Create a new group to categorize your items."}
                </DialogDescription>
              </DialogHeader>
              <GroupForm 
                onSuccess={() => setIsDialogOpen(false)} 
                initialValues={editingGroup || undefined}
                onSubmit={handleSave}
              />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable 
          columns={columns} 
          data={groups} 
          searchKey="name"
          isServerSide={true}
          pageIndex={page - 1}
          pageSize={limit}
          pageCount={pagination.totalPages}
          totalItems={pagination.totalItems}
          searchValue={search}
          onSearchChange={setSearch}
          onPageChange={(p) => setPage(p + 1)}
        />
      </div>
    </ContentLayout>
  )
}
