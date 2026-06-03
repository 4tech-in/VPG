"use client"

import { useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash, Briefcase } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { useBusinessNodes, BusinessNode } from "@/hooks/use-business-nodes"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { cn } from "@/lib/utils"

export default function BusinessNodesPage() {
  const router = useRouter()
  const { 
    businessNodes, 
    removeBusinessNode, 
    toggleBusinessNodeStatus,
    page,
    setPage,
    limit,
    search,
    setSearch,
    pagination,
  } = useBusinessNodes()

  const handleStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleBusinessNodeStatus(id)
    } catch (error) {
      // Handled in hook
    }
  }, [toggleBusinessNodeStatus])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeBusinessNode(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeBusinessNode])

  const handleEdit = useCallback((node: BusinessNode) => {
    router.push(`/business-nodes/${node.id}`)
  }, [router])

  const handleAddNew = useCallback(() => {
    router.push("/business-nodes/new")
  }, [router])

  const columns = useMemo<ColumnDef<BusinessNode>[]>(() => [
    {
      accessorKey: "id",
      header: "S.No",
      cell: ({ row }) => <div className="pl-2">{row.index + 1 + (page - 1) * limit}</div>,
    },
    {
      accessorKey: "name",
      header: "Node Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
            <Briefcase className="h-4 w-4" />
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
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="pl-2">
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 uppercase tracking-wider text-[10px]">
            {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive
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
              {isActive ? "Active" : "Inactive"}
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
    <ContentLayout title="Business Nodes">
      <div className="flex flex-col gap-4 p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Business Nodes</h1>
            <p className="text-xs text-zinc-500 mt-1">Manage organization structure hierarchy and business units.</p>
          </div>
          <Button variant="default" onClick={handleAddNew}>
            Add Node
          </Button>
        </div>
        <DataTable 
          columns={columns} 
          data={businessNodes} 
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
