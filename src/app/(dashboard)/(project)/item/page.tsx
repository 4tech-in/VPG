"use client"

import { useState, useMemo, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash, Tag, Box, Info } from "lucide-react"

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
import { ItemForm } from "@/components/item-form"
import { useItems, Item } from "@/hooks/use-items"
import { cn } from "@/lib/utils"

export default function ItemPage() {
   const {
      items,
      isLoading,
      addItem,
      editItem,
      removeItem,
      toggleItemBlockStatus,
      page,
      setPage,
      limit,
      setLimit,
      search,
      setSearch,
      pagination,
   } = useItems()

   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [editingItem, setEditingItem] = useState<Item | null>(null)

   const handleStatusToggle = useCallback(async (id: string) => {
      try {
         await toggleItemBlockStatus(id)
      } catch (error) {
         // Handled in hook
      }
   }, [toggleItemBlockStatus])

   const handleDelete = useCallback(async (id: string) => {
      try {
         await removeItem(id)
      } catch (error) {
         // Handled in hook
      }
   }, [removeItem])

   const handleEdit = useCallback((item: Item) => {
      setEditingItem(item)
      setIsDialogOpen(true)
   }, [])

   const handleAddNew = useCallback(() => {
      setEditingItem(null)
      setIsDialogOpen(true)
   }, [])

   const handleSave = async (payload: any) => {
      try {
         if (editingItem) {
            await editItem(editingItem.id, payload)
         } else {
            await addItem(payload)
         }
         setIsDialogOpen(false)
      } catch (error) {
         throw error
      }
   }

   const columns = useMemo<ColumnDef<Item>[]>(() => [
      {
         accessorKey: "id",
         header: () => <div className="text-center w-full">S.No</div>,
         cell: ({ row }) => <div className="text-center w-full font-medium text-zinc-500">{row.index + 1 + (page - 1) * limit}</div>,
      },
      { accessorKey: "itemCode",
         header: () => <div className="text-center w-full">Item Code</div>,
         cell: ({ row }) => <div className="text-center w-full font-medium text-zinc-500">{row.original.itemCode}</div>
      },
      {
         accessorKey: "name",
         header: "Item Name",
         cell: ({ row }) => (
            <div className="flex flex-col">
               <span className="font-bold text-zinc-900 leading-none mb-1">{row.getValue("name")}</span>
               <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase tracking-tighter font-medium">
                  <Tag className="h-2.5 w-2.5" /> {row.original.group || "General"}
               </div>
            </div>
         ),
      },
      {
         accessorKey: "specification",
         header: "Specification",
         cell: ({ row }) => (
            <div className="max-w-[180px] flex items-start gap-1.5 text-zinc-500 font-medium">
               <Info className="h-3 w-3 mt-0.5 shrink-0 text-zinc-300" />
               <span className="text-xs line-clamp-2 leading-tight italic">{row.getValue("specification") || "N/A"}</span>
            </div>
         ),
      },
      {
         accessorKey: "unit",
         header: () => <div className="text-center w-full">Unit</div>,
         cell: ({ row }) => (
            <div className="text-center w-full">
               <span className="text-[10px] font-black bg-zinc-100 text-zinc-600 px-2 py-1 rounded-lg uppercase border border-zinc-200">
                  {row.getValue("unit")}
               </span>
            </div>
         ),
      },
      {
         accessorKey: "price",
         header: () => <div className="text-center w-full">Unit Price</div>,
         cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-IN", {
               style: "currency",
               currency: "INR",
            }).format(price)
            return (
               <div className="text-center w-full">
                  <span className="font-black text-zinc-900 text-sm tracking-tight">{formatted}</span>
               </div>
            )
         },
      },
      {
         accessorKey: "isBlocked",
         header: () => <div className="text-center w-full">Status</div>,
         cell: ({ row }) => {
            const isBlocked = row.getValue("isBlocked") as boolean
            return (
               <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <AppleSwitch
                     checked={isBlocked}
                     onCheckedChange={() => handleStatusToggle(row.original.id)}
                     size="sm"
                  />
                  <span className={cn(
                     "text-xs font-bold min-w-[65px] px-2 py-0.5 rounded-full transition-colors text-center",
                     isBlocked ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"
                  )}>
                     {isBlocked ? "Blocked" : "Not Blocked"}
                  </span>
               </div>
            )
         },
      },
      {
         id: "actions",
         header: () => <div className="text-center w-full">Action</div>,
         cell: ({ row }) => {
            return (
               <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                     variant="ghost"
                     size="icon"
                     className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                     onClick={() => handleEdit(row.original)}
                  >
                     <Edit className="h-4 w-4" />
                     <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                     variant="ghost"
                     size="icon"
                     className="h-9 w-9 rounded-xl text-zinc-400 hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
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
      <ContentLayout title="Inventory Management">
         <div className="flex flex-col gap-8 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                     <Box className="h-3 w-3" /> Catalog
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-zinc-900">Inventory Items</h1>
                  <p className="text-zinc-500 text-sm font-medium">Manage your product catalog, specifications, and regional pricing from this central repository.</p>
               </div>
               <Button
                  onClick={handleAddNew}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 animate-in fade-in-50 duration-300"
               >
                  <span className="font-bold">Add New Item</span>
               </Button>
            </div>

            {/* Table Section */}
            {/* <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm animate-in fade-in duration-300">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                     <h2 className="font-bold text-zinc-800">Item Master List</h2>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                        Total Items: {pagination.totalItems}
                     </div>
                  </div>
               </div> */}
               
               <DataTable 
                  columns={columns} 
                  data={items} 
                  searchKey="name"
                  isServerSide={true}
                  pageIndex={page - 1}
                  pageSize={limit}
                  pageCount={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  searchValue={search}
                  onSearchChange={setSearch}
                  onPageChange={(p) => setPage(p + 1)}
                  onPageSizeChange={(size) => setLimit(size)}
               />
            {/* </div> */}

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
               <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                  <DialogHeader className="pb-4 border-b border-zinc-100 mb-6">
                     <DialogTitle className="text-2xl font-black">{editingItem ? "Update Item Master" : "Create Catalog Item"}</DialogTitle>
                     <DialogDescription className="font-medium text-zinc-500">
                        {editingItem
                           ? "Modify the technical specifications and pricing for this item."
                           : "Initialize a new item record in the master inventory database."}
                     </DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                     {isDialogOpen && (
                        <ItemForm
                           onSuccess={() => setIsDialogOpen(false)}
                           onSubmit={handleSave}
                           initialValues={editingItem ? {
                              groupName: editingItem.groupId,
                              subGroup: editingItem.subGroupId || "",
                              itemName: editingItem.name,
                              itemCode: editingItem.itemCode,
                              specification: editingItem.specification,
                              size: editingItem.size,
                              info: editingItem.info,
                              unit: editingItem.unitId,
                              rate: editingItem.price.toString(),
                              gst: editingItem.gst,
                              hsnCode: editingItem.hsnCode,
                              minLevel: editingItem.minLevel,
                              maxLevel: editingItem.maxLevel,
                              openingLedger: editingItem.openingLedger,
                              openingPhysical: editingItem.openingPhysical,
                              isBlocked: editingItem.isBlocked,
                           } : undefined}
                        />
                     )}
                  </div>
               </DialogContent>
            </Dialog>
         </div>
      </ContentLayout>
   )
}