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
import { SubGroupForm } from "@/components/sub-group-form"

type SubGroup = {
  id: number
  group: string
  subGroup: string
  status: "Active" | "Inactive"
}

const initialData: SubGroup[] = [
  { id: 1, group: "Tech", subGroup: "Hardware", status: "Active" },
  { id: 2, group: "Tech", subGroup: "Software", status: "Active" },
  { id: 3, group: "Home", subGroup: "Kitchen", status: "Inactive" },
  { id: 4, group: "Fashion", subGroup: "Men's Wear", status: "Active" },
  { id: 5, group: "Office", subGroup: "Supplies", status: "Active" },
]

export default function SubGroupPage() {
  const [data, setData] = useState<SubGroup[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubGroup, setEditingSubGroup] = useState<SubGroup | null>(null)

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

  const handleEdit = (subGroup: SubGroup) => {
    setEditingSubGroup(subGroup)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingSubGroup(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<SubGroup>[] = [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>,
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-full border-zinc-200 text-zinc-600 font-normal">
          {row.getValue("group")}
        </Badge>
      ),
    },
    {
      accessorKey: "subGroup",
      header: "Sub Group",
      cell: ({ row }) => <div className="font-medium text-zinc-900">{row.getValue("subGroup")}</div>,
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
              <SubGroupForm 
                onSuccess={() => setIsDialogOpen(false)} 
                initialValues={editingSubGroup ? {
                  ...editingSubGroup,
                  group: editingSubGroup.group.toLowerCase(), // Mapping label to value
                } : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} searchKey="subGroup" />
      </div>
    </ContentLayout>
  )
}