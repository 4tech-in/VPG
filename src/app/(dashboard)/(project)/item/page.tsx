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
import { ItemForm } from "@/components/item-form"

type Item = {
  id: number
  code: string
  name: string
  specification: string
  unit: string
  group: string
  price: number
  isBlocked: boolean
}

const initialData: Item[] = [
  {
    id: 1,
    code: "CM/P/RM/0001",
    name: "Steel Rod 10mm",
    specification: "Grade Fe500, 12m length",
    unit: "PCS",
    group: "Construction Materials",
    price: 450.0,
    isBlocked: false,
  },
  {
    id: 2,
    code: "CM/C/RM/0002",
    name: "Cement 50kg Bag",
    specification: "OPC 43 Grade",
    unit: "BAG",
    group: "Construction Materials",
    price: 380.0,
    isBlocked: false,
  },
  {
    id: 3,
    code: "P/P/RM/0003",
    name: "PVC Pipe 4\"",
    specification: "Heavy Duty, 6m",
    unit: "PCS",
    group: "Plumbing",
    price: 1200.0,
    isBlocked: true,
  },
  {
    id: 4,
    code: "E/W/RM/0004",
    name: "Copper Wire 2.5sqmm",
    specification: "90m Coil, FR LSH",
    unit: "COIL",
    group: "Electricals",
    price: 2150.0,
    isBlocked: false,
  },
]

export default function ItemPage() {
  const [data, setData] = useState<Item[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  const handleStatusToggle = (id: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isBlocked: !item.isBlocked }
          : item
      )
    )
  }

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>,
    },
    {
      accessorKey: "code",
      header: "Item Code",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono bg-zinc-100 text-zinc-700 border-none rounded-md">
          {row.getValue("code")}
        </Badge>
      ),
    },
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => <div className="font-medium text-zinc-900">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "specification",
      header: "Specification",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-zinc-500">
          {row.getValue("specification")}
        </div>
      ),
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => (
        <div className="uppercase text-zinc-600 font-medium">{row.getValue("unit")}</div>
      ),
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
      accessorKey: "price",
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(price)
        return <div className="text-right font-semibold text-zinc-900">{formatted}</div>
      },
    },
    {
      accessorKey: "isBlocked",
      header: "Status",
      cell: ({ row }) => {
        const isBlocked = row.getValue("isBlocked") as boolean
        return (
          <Badge 
            variant={isBlocked ? "destructive" : "success"}
            className="rounded-full px-4 py-1 font-medium"
          >
            {isBlocked ? "Blocked" : "Active"}
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
                  <AppleSwitch checked={!row.original.isBlocked} size="sm" className="scale-75" /> 
                  {row.original.isBlocked ? "Unblock" : "Block"}
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
    <ContentLayout title="Item">
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Item List</h1>
          <Button variant="default" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem 
                    ? "Update the details for the existing item below." 
                    : "Enter the details for the new item below."}
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <ItemForm 
                  onSuccess={() => setIsDialogOpen(false)} 
                  initialValues={editingItem ? {
                    itemName: editingItem.name,
                    itemCode: editingItem.code,
                    specification: editingItem.specification,
                    unit: editingItem.unit,
                    rate: editingItem.price.toString(),
                    isBlocked: editingItem.isBlocked,
                    // Note: Mapping labels to values for Selects
                    groupName: editingItem.group === "Construction Materials" ? "construction" : 
                               editingItem.group === "Plumbing" ? "plumbing" : 
                               editingItem.group === "Electricals" ? "electrical" : "",
                  } : undefined}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </ContentLayout>
  )
}