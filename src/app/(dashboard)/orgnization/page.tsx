"use client"

import { useState, useMemo, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash, Building2 } from "lucide-react"

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
import { OrganizationForm } from "@/components/organization-form"
import { useOrganizations, Organization } from "@/hooks/use-organizations"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { cn } from "@/lib/utils"

export default function OrganizationPage() {
  const { 
    organizations, 
    addOrganization, 
    editOrganization, 
    removeOrganization, 
    toggleOrganizationStatus,
    page,
    setPage,
    limit,
    search,
    setSearch,
    pagination,
    isLoading
  } = useOrganizations()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleOrganizationStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleOrganizationStatus])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeOrganization(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeOrganization])

  const handleEdit = useCallback((org: Organization) => {
    setEditingOrg(org)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingOrg(null)
    setIsDialogOpen(true)
  }, [])

  const handleSave = async (values: { 
    name: string; 
    industryType?: string | null; 
    email?: string | null; 
    mobile?: string | null; 
    address?: string | null; 
  }) => {
    try {
      if (editingOrg) {
        await editOrganization(editingOrg.id, values)
      } else {
        await addOrganization({
          ...values,
          isActive: true
        })
      }
    } catch (error) {
      throw error
    }
  }

  const columns = useMemo<ColumnDef<Organization>[]>(() => [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1 + (page - 1) * limit}</div>,
    },
    {
      accessorKey: "name",
      header: "Organization Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900">{row.original.name}</div>
            {row.original.industryType && (
              <div className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">
                {row.original.industryType}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="pl-2 text-sm text-zinc-600 font-medium">{row.getValue("email") || "—"}</div>,
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => <div className="pl-2 text-sm text-zinc-600">{row.getValue("mobile") || "—"}</div>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="pl-2 max-w-[200px] truncate text-sm text-zinc-500" title={row.getValue("address") || ""}>
          {row.getValue("address") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive
        const statusText = row.original.status
        return (
          <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
            <AppleSwitch
              checked={isActive}
              onCheckedChange={() => handleStatusToggle(row.original.id)}
              size="sm"
            />
            <span className={cn(
              "text-xs font-bold min-w-[65px] px-2 py-0.5 rounded-full transition-colors text-center",
              isActive ? "text-emerald-700 bg-emerald-50" : "text-zinc-500 bg-zinc-100"
            )}>
              {statusText}
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
    <ContentLayout title="Organization">
      <div className="flex flex-col gap-4 p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Organization List</h1>
            <p className="text-xs text-zinc-500 mt-1">Manage partner organizations, clients, and corporate business entities.</p>
          </div>
          <Button variant="default" onClick={handleAddNew}>
            Add Organization
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[480px] rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-zinc-950">{editingOrg ? "Edit Organization" : "Add New Organization"}</DialogTitle>
                <DialogDescription className="text-sm text-zinc-500">
                  {editingOrg 
                    ? "Update the configuration details for this organization entity." 
                    : "Register a brand new organization entity into the system."}
                </DialogDescription>
              </DialogHeader>
              <OrganizationForm 
                onSuccess={() => setIsDialogOpen(false)} 
                initialValues={editingOrg || undefined}
                onSubmit={handleSave}
              />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable 
          columns={columns} 
          data={organizations} 
          searchKey="name"
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
