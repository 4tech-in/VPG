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
import { CategoryForm } from "@/components/category-form"

// Define the shape of our data
type Category = {
  id: number
  name: string
  groups: string
}

const initialCategories: Category[] = [
  { id: 1, name: "Electronics", groups: "Tech, Gadgets" },
  { id: 2, name: "Furniture", groups: "Home, Office" },
  { id: 3, name: "Clothing", groups: "Fashion, Apparel" },
  { id: 4, name: "Books", groups: "Education, Leisure" },
  { id: 5, name: "Groceries", groups: "Daily Needs, Food" },
]

export default function CategoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setCategories((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => <div className="font-medium text-zinc-900">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "groups",
      header: "Associated Groups",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.getValue("groups") as string).split(",").map((group) => (
            <Badge key={group} variant="secondary" className="bg-zinc-100 text-zinc-600 border-none text-[10px]">
              {group.trim()}
            </Badge>
          ))}
        </div>
      ),
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
    <ContentLayout title="Category">
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Category List</h1>
          <Button variant="default" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? "Update the details for the existing category." 
                    : "Create a new category and associate it with groups."}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm 
                onSuccess={() => setIsDialogOpen(false)} 
                initialValues={editingCategory ? {
                  ...editingCategory,
                  // Mapping the first associated group as a hint for the select
                  groups: editingCategory.groups.split(",")[0].trim().toLowerCase(),
                } : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={categories} searchKey="name" />
      </div>
    </ContentLayout>
  )
}