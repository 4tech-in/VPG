"use client"

import { useState, useMemo, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Trash } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubGroupForm } from "@/components/sub-group-form"
import { useSubGroups, SubGroup } from "@/hooks/use-sub-groups"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { cn } from "@/lib/utils"

export default function SubGroupPage() {
  const { 
    subGroups, 
    addSubGroup, 
    editSubGroup, 
    removeSubGroup, 
    toggleSubGroupStatus,
    page,
    setPage,
    limit,
    search,
    setSearch,
    pagination,
  } = useSubGroups()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubGroup, setEditingSubGroup] = useState<SubGroup | null>(null)

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleSubGroupStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleSubGroupStatus])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeSubGroup(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeSubGroup])

  const handleEdit = useCallback((subGroup: SubGroup) => {
    setEditingSubGroup(subGroup)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingSubGroup(null)
    setIsDialogOpen(true)
  }, [])

  const handleSave = async (values: { group: string; subGroup: string; status: string }) => {
    try {
      if (editingSubGroup) {
        // Status is omitted during edit saves to prevent status override
        await editSubGroup(editingSubGroup.id, {
          groupId: values.group,
          name: values.subGroup,
        })
      } else {
        await addSubGroup({
          groupId: values.group,
          name: values.subGroup,
          status: values.status === "Active" ? "active" : "inactive",
        })
      }
    } catch (error) {
      throw error
    }
  }

  const columns = useMemo<ColumnDef<SubGroup>[]>(() => [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1 + (page - 1) * limit}</div>,
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => (
        <div className="pl-2">
          <Badge variant="outline" className="rounded-full border-zinc-200 text-zinc-600 font-normal">
            {row.getValue("group")}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "subGroup",
      header: "Sub Group",
      cell: ({ row }) => <div className="pl-2 font-medium text-zinc-900">{row.getValue("subGroup")}</div>,
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
    <ContentLayout title="Sub Group">
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Sub Group List</h1>
          <Button variant="default" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Sub Group
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingSubGroup ? "Edit Sub Group" : "Add New Sub Group"}</DialogTitle>
                <DialogDescription>
                  {editingSubGroup 
                    ? "Update the details for the existing sub group." 
                    : "Create a new sub group and associate it with a group."}
                </DialogDescription>
              </DialogHeader>
              {isDialogOpen && (
                <SubGroupForm 
                  onSuccess={() => setIsDialogOpen(false)} 
                  onSubmit={handleSave}
                  initialValues={editingSubGroup ? {
                    group: editingSubGroup.groupId,
                    subGroup: editingSubGroup.subGroup,
                    status: editingSubGroup.status,
                  } : undefined}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
        <DataTable 
          columns={columns} 
          data={subGroups} 
          searchKey="subGroup"
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