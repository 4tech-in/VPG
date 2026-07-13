"use client"

import { useState, useMemo, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Building2,
  Plus,
  Search,
  Zap,
  LayoutGrid,
  ListFilter,
  ShieldCheck,
  Factory,
  Edit,
  Trash,
  Phone,
  Mail,
  User
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { VendorDialog } from "@/components/vendor/vendor-form"
import { cn } from "@/lib/utils"
import { useVendors, Vendor } from "@/hooks/use-vendors"
import { Checkbox } from "@/components/ui/checkbox"
import { vendorService } from "@/service/vendorService"
import { toast } from "sonner"

export default function VendorPage() {
  const {
    vendors,
    isLoading,
    addVendor,
    editVendor,
    removeVendor,
    toggleVendorStatus,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
    refetch,
  } = useVendors()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const handleEdit = useCallback((vendor: Vendor) => {
    setEditingVendor(vendor)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingVendor(null)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeVendor(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeVendor])

  const handleSave = async (payload: any) => {
    try {
      if (editingVendor) {
        await editVendor(editingVendor.id, payload)
      } else {
        await addVendor(payload)
      }
      setIsDialogOpen(false)
    } catch (error) {
      throw error
    }
  }

  const handleBulkAction = async (action: "block" | "soft-delete" | "export") => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    if (selectedIds.length === 0) return;
    
    try {
      if (action === "export") {
        const data = await vendorService.bulkAction(action, selectedIds);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vendors-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Vendors exported successfully");
      } else {
        await vendorService.bulkAction(action, selectedIds);
        toast.success(`Bulk action '${action}' completed successfully`);
        setRowSelection({});
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk action failed");
    }
  };

  const columns = useMemo<ColumnDef<Vendor>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "vendorCode",
      header: "CODE",
      cell: ({ row }) => (
        <div className="text-[13px] font-bold text-zinc-600 pl-4">
          {row.getValue("vendorCode") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "VENDOR",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-4">
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 leading-tight">{row.getValue("name")}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-4">
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 leading-tight">{row.getValue("companyName")}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "contactNumber",
      header: "CONTACT",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 text-xs text-zinc-500 font-medium">
           <span className="flex items-center gap-1.5 mt-0.5">
            <User className="h-3.5 w-3.5 text-zinc-400" /> {row.getValue("contactPerson")}
            {row.original.contactPerson && (
              <span className="text-[11px] text-zinc-400">{row.original.contactPerson}</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 mt-0.5">
            <Phone className="h-3.5 w-3.5 text-zinc-400" /> {row.getValue("contactNumber")}
            {row.original.alternateNumber && (
              <span className="text-[11px] text-zinc-400">/ {row.original.alternateNumber}</span>
            )}
          </span>
          {row.original.email && (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Mail className="h-3.5 w-3.5 text-zinc-400" /> {row.original.email}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "OPERATIONAL SITE",
      cell: ({ row }) => {
        const hasLocation = row.original.address || row.original.city || row.original.state;
        if (!hasLocation) return <span className="text-xs text-zinc-400">N/A</span>;
        return (
          <div className="flex flex-col text-xs text-zinc-500 font-medium">
            {row.original.address && (
              <span className="text-zinc-800 font-semibold">{row.original.address}</span>
            )}
            <span className="text-[11px] text-zinc-400 mt-0.5">
              {row.original.city && `${row.original.city}, `}
              {row.original.state}
              {row.original.pincode && ` - ${row.original.pincode}`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "gstNumber",
      header: "GST",
      cell: ({ row }) => {
        const hasBusinessInfo = row.original.gstNumber || row.original.panNumber;
        if (!hasBusinessInfo) return <span className="text-xs text-zinc-400">N/A</span>;
        return (
          <div className="flex flex-col text-[11px] text-zinc-500 font-medium gap-0.5">
            {row.original.gstNumber && (
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-[9px] uppercase bg-zinc-100 text-zinc-600 px-1 rounded">GST</span>
                <span className="font-mono text-zinc-700">{row.original.gstNumber}</span>
              </div>
            )}
            {row.original.panNumber && (
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-[9px] uppercase bg-zinc-100 text-zinc-600 px-1 rounded">PAN</span>
                <span className="font-mono text-zinc-700">{row.original.panNumber}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "bankName",
      header: "BANK DETAILS",
      cell: ({ row }) => {
        const hasBank = row.original.bankName || row.original.accountNumber || row.original.ifscCode;
        if (!hasBank) return <span className="text-xs text-zinc-400">N/A</span>;
        return (
          <div className="flex flex-col text-xs text-zinc-500 font-medium">
            {row.original.bankName && (
              <span className="text-zinc-800 font-bold">{row.original.bankName}</span>
            )}
            {row.original.accountNumber && (
              <span className="font-mono text-[11px] text-zinc-600 mt-0.5">A/C: {row.original.accountNumber}</span>
            )}
            {row.original.ifscCode && (
              <span className="font-mono text-[10px] text-zinc-400 uppercase">IFSC: {row.original.ifscCode}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "itemName",
      header: "SUPPLIED ITEM",
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-lg font-bold text-zinc-500 border-zinc-100 uppercase tracking-tighter text-[10px]">
          {row.getValue("itemName") || "General"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "REGISTERED",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-zinc-500">
          {row.original.createdAt || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-full px-4 py-0.5 font-bold border-none",
            status === "Active" 
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
              : "bg-rose-100 text-rose-700 hover:bg-rose-100"
          )}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center w-full">Action</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center gap-1">
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
  ], [handleEdit, handleDelete])

  return (
    <ContentLayout title="Strategic Vendors">
      <div className="flex flex-col gap-10 p-6 sm:p-12 max-w-[1700px] mx-auto min-h-screen animate-in fade-in duration-300">

        {/* Header Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Vendors</h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Partner Ecosystem Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleAddNew}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 animate-in fade-in-50 duration-300"
               >
              Add Vendor
            </Button>
          </div>
        </div>
        {/* Vendor Inventory Table */}
        <DataTable
          columns={columns}
          data={vendors}
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
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </div>

      <VendorDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSave}
        initialValues={editingVendor ? {
          vendorCode: editingVendor.vendorCode,
          name: editingVendor.name,
          companyName: editingVendor.companyName,
          itemId: editingVendor.itemId,
          itemName: editingVendor.itemName,
          contactPerson: editingVendor.contactPerson,
          contactNumber: editingVendor.contactNumber,
          alternateNumber: editingVendor.alternateNumber,
          email: editingVendor.email,
          gstNumber: editingVendor.gstNumber,
          panNumber: editingVendor.panNumber,
          address: editingVendor.address,
          city: editingVendor.city,
          state: editingVendor.state,
          pincode: editingVendor.pincode,
          bankName: editingVendor.bankName,
          accountNumber: editingVendor.accountNumber,
          ifscCode: editingVendor.ifscCode,
          status: editingVendor.status.toLowerCase(),
        } : undefined}
      />

      {/* Floating Bulk Actions Bar */}
      {Object.keys(rowSelection).filter(id => rowSelection[id]).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-bold text-zinc-600">
            <span className="text-primary font-black">{Object.keys(rowSelection).filter(id => rowSelection[id]).length}</span> selected
          </span>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("block")}
              className="h-9 px-4 rounded-xl font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              Block
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("soft-delete")}
              className="h-9 px-4 rounded-xl font-bold border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              Delete
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleBulkAction("export")}
              className="h-9 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/95"
            >
              Export
            </Button>
          </div>
        </div>
      )}
    </ContentLayout>
  )
}