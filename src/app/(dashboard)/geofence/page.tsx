"use client"

import { useState, useMemo, useCallback } from "react"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { GeofenceDialog } from "@/components/geofence-dialog"
import { useGeofences, Geofence } from "@/hooks/use-geofences"

export default function GeofencePage() {
  const {
    geofences,
    isLoading,
    addGeofence,
    editGeofence,
    removeGeofence,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    pagination,
  } = useGeofences()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null)

  const handleEdit = useCallback((gf: Geofence) => {
    setEditingGeofence(gf)
    setIsDialogOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingGeofence(null)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeGeofence(id)
    } catch (error) {
      // Handled in hook
    }
  }, [removeGeofence])

  const handleSave = async (payload: any) => {
    try {
      if (editingGeofence) {
        await editGeofence(editingGeofence.id, payload)
      } else {
        await addGeofence(payload)
      }
      setIsDialogOpen(false)
    } catch (error) {
      throw error
    }
  }

  const columns = useMemo<ColumnDef<Geofence>[]>(() => [
    {
      accessorKey: "name",
      header: "NAME",
      cell: ({ row }) => (
        <div className="flex flex-col pl-4">
          <span className="font-bold text-zinc-900">{row.getValue("name")}</span>
          {row.original.address && (
            <span className="text-[11px] font-medium text-zinc-400 mt-0.5">{row.original.address}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "latitude",
      header: "LATITUDE",
      cell: ({ row }) => <span className="text-zinc-500 font-medium pl-4">{row.getValue("latitude")}</span>,
    },
    {
      accessorKey: "longitude",
      header: "LONGITUDE",
      cell: ({ row }) => <span className="text-zinc-500 font-medium pl-4">{row.getValue("longitude")}</span>,
    },
    {
      accessorKey: "radius",
      header: "RADIUS (M)",
      cell: ({ row }) => <span className="font-bold text-zinc-900 pl-4">{row.getValue("radius")}</span>,
    },
    {
      id: "actions",
      header: () => <div className="text-center w-full">Action</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            className="h-9 w-9 rounded-full text-zinc-400 hover:text-primary hover:bg-primary/5"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete])

  return (
    <ContentLayout title="Geo Locations">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Geo Locations</h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Attendance Bounds Manager</p>
            </div>
          </div>

          <Button
            onClick={handleAddNew}
            className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground flex items-center gap-2 transition-all active:scale-95 duration-300"
          >
            Add Geofence
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={geofences}
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
      </div>

      <GeofenceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialValues={editingGeofence}
        onSubmit={handleSave}
      />
    </ContentLayout>
  )
}