"use client"

import { useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash, ShieldCheck } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { useRoles, Role } from "@/hooks/use-roles"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { cn } from "@/lib/utils"

export default function RolePage() {
  const router = useRouter()
  const { 
    roles, 
    removeRole, 
    toggleRoleStatus,
    page,
    setPage,
    limit,
    search,
    setSearch,
    pagination,
  } = useRoles()

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleRoleStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleRoleStatus])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeRole(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeRole])

  const handleEdit = useCallback((role: Role) => {
    router.push(`/roles/${role.id}`)
  }, [router])

  const handleAddNew = useCallback(() => {
    router.push("/roles/new")
  }, [router])

  const columns = useMemo<ColumnDef<Role>[]>(() => [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1 + (page - 1) * limit}</div>,
    },
    {
      accessorKey: "name",
      header: "Role Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
              {row.original.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "scope",
      header: "Scope",
      cell: ({ row }) => (
        <div className="pl-2">
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 uppercase tracking-wider text-[10px]">
            {row.original.scope}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive
        const statusText = row.original.status
        const isSystemRole = row.original.isSystemRole
        return (
          <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
            <AppleSwitch
              checked={isActive}
              onCheckedChange={() => handleStatusToggle(row.original.id)}
              disabled={isSystemRole}
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
        const isSystemRole = row.original.isSystemRole
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
              disabled={isSystemRole}
              className={cn(
                "h-8 w-8 rounded-lg transition-all duration-200",
                isSystemRole 
                  ? "text-zinc-300 border-zinc-100 cursor-not-allowed bg-zinc-50"
                  : "text-destructive hover:text-destructive hover:bg-destructive/10 border-zinc-200 hover:border-destructive/20"
              )}
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
    <ContentLayout title="Role">
      <div className="flex flex-col gap-4 p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Role List</h1>
            <p className="text-xs text-zinc-500 mt-1">Configure role permissions, access levels, and granular action scopes.</p>
          </div>
          <Button variant="default" onClick={handleAddNew}>
            Add Role
          </Button>
        </div>
        <DataTable 
          columns={columns} 
          data={roles} 
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
