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
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => <div className="font-medium">{row.getValue("group")}</div>,
    },
    {
      accessorKey: "subGroup",
      header: "Sub Group",
      cell: ({ row }) => <div>{row.getValue("subGroup")}</div>,
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
        <DataTable columns={columns} data={data} />
      </div>
    </ContentLayout>
  )
}