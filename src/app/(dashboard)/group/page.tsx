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
import { GroupForm } from "@/components/group-form"

type Group = {
  id: number
  name: string
  status: "Active" | "Inactive"
}

const initialData: Group[] = [
  { id: 1, name: "Tech", status: "Active" },
  { id: 2, name: "Gadgets", status: "Active" },
  { id: 3, name: "Home", status: "Inactive" },
  { id: 4, name: "Office", status: "Active" },
  { id: 5, name: "Fashion", status: "Active" },
]

export default function GroupPage() {
  const [data, setData] = useState<Group[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

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

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingGroup(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
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
              />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} />
      </div>
    </ContentLayout>
  )
}
