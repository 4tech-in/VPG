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
      cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium text-zinc-900">{row.getValue("name")}</div>,
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
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </ContentLayout>
  )
}
