"use client"

import { useState, useEffect } from "react"
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
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => <div className="font-medium">{row.getValue("label")}</div>,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => <div className="font-mono font-bold text-primary">{row.getValue("value")}</div>,
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
        <DataTable columns={columns} data={data} />
      </div>
    </ContentLayout>
  )
}
