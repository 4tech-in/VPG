"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUnits, Unit } from "@/hooks/use-units"
import { toast } from "sonner"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { cn } from "@/lib/utils"

export default function UnitPage() {
  const { 
    units, 
    isLoading, 
    addUnit, 
    editUnit, 
    removeUnit, 
    toggleUnitStatus,
    page,
    setPage,
    limit,
    search,
    setSearch,
    pagination,
  } = useUnits()
  
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

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeUnit(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeUnit])

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleUnitStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleUnitStatus])

  const handleEdit = useCallback((unit: Unit) => {
    setEditingUnit(unit)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingUnit(null)
    setIsDialogOpen(true)
  }, [])

  const handleSave = async () => {
    if (!label.trim() || !value.trim()) {
      toast.error("Please fill in both label and value fields.")
      return
    }

    try {
      if (editingUnit) {
        await editUnit(editingUnit.id, {
          label: label.trim(),
          value: value.trim(),
        })
      } else {
        await addUnit({
          label: label.trim(),
          value: value.trim(),
          status: "active",
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      // Handled in hook
    }
  }

  const columns = useMemo<ColumnDef<Unit>[]>(() => [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1 + (page - 1) * limit}</div>,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => <div className="pl-2 font-medium text-zinc-900">{row.getValue("label")}</div>,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => <div className="pl-2 text-zinc-600">{row.getValue("value")}</div>,
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : editingUnit ? "Update Unit" : "Save Unit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable 
          columns={columns} 
          data={units} 
          searchKey="label"
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
