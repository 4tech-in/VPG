"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Unit = {
  id: number
  label: string
  value: string
  status: "Active" | "Inactive"
}

const initialData: Unit[] = [
  { id: 1, label: "Kilogram", value: "KG", status: "Active" },
  { id: 2, label: "Pieces", value: "PCS", status: "Active" },
  { id: 3, label: "Bags", value: "BAG", status: "Active" },
  { id: 4, label: "Coils", value: "COIL", status: "Inactive" },
  { id: 5, label: "Meters", value: "MTR", status: "Active" },
]

export default function UnitPage() {
  const [data, setData] = useState<Unit[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  
  // Form states
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")

  useEffect(() => {
    if (editingUnit) {
      setLabel(editingUnit.label)
      setValue(editingUnit.value)
    } else {
      setLabel("")
      setValue("")
    }
  }, [editingUnit])

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingUnit(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Unit>[] = [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => <div className="font-medium text-zinc-900">{row.getValue("label")}</div>,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => <div className="text-zinc-600">{row.getValue("value")}</div>,
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
    <ContentLayout title="Unit Management">
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Unit List</h1>
          <Button variant="default" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Unit
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Edit Unit" : "Add New Unit"}</DialogTitle>
                <DialogDescription>
                  {editingUnit 
                    ? "Update the details for the existing unit of measurement." 
                    : "Define a new unit of measurement for your inventory."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="label">Label</Label>
                  <Input 
                    id="label" 
                    placeholder="e.g. Kilogram" 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Value</Label>
                  <Input 
                    id="value" 
                    placeholder="e.g. KG" 
                    className="uppercase" 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  {editingUnit ? "Update Unit" : "Save Unit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} searchKey="label" />
      </div>
    </ContentLayout>
  )
}
