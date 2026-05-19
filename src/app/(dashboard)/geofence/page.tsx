"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { GeofenceDialog } from "@/components/geofence-dialog"

type Geofence = {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
}

const mockGeofences: Geofence[] = [
  { id: "1", name: "VPG Twin Towers", latitude: 30.7866602, longitude: 76.7546189, radius: 100 },
  { id: "2", name: "VPG Royce", latitude: 30.63337829999999, longitude: 76.7264209, radius: 100 },
  { id: "3", name: "Sector 22A", latitude: 30.7348906, longitude: 76.7700722, radius: 500 },
]

export default function GeofencePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const columns: ColumnDef<Geofence>[] = [
    {
      accessorKey: "name",
      header: "NAME",
      cell: ({ row }) => <span className="font-bold text-zinc-900">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "latitude",
      header: "LATITUDE",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.getValue("latitude")}</span>,
    },
    {
      accessorKey: "longitude",
      header: "LONGITUDE",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.getValue("longitude")}</span>,
    },
    {
      accessorKey: "radius",
      header: "RADIUS (M)",
      cell: ({ row }) => <span className="font-bold text-zinc-900">{row.getValue("radius")}</span>,
    },
    {
      id: "actions",
      header: "ACTION",
      cell: () => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            className="h-9 w-9 rounded-full text-zinc-400 hover:text-primary hover:bg-primary/5"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ContentLayout title="Geo Locations">
      <div className="flex flex-col gap-8 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Geo Locations</h1>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Geofence
          </Button>
        </div>

        <DataTable columns={columns} data={mockGeofences} />
      </div>

      <GeofenceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </ContentLayout>
  )
}