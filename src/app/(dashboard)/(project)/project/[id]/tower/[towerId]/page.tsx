"use client"

import { useMemo, useCallback, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  Building2, 
  Building, 
  Tag, 
  ShieldCheck,
  FileText,
  Clock,
  Plus,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { cn } from "@/lib/utils"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function TowerDetailsPage({ 
  params 
}: { 
  params: { id: string; towerId: string } 
}) {
  // In a real app, you'd fetch this data based on the ID
  const tower = {
    id: params.towerId,
    name: "Tower A",
    number: "A-101",
    status: "Active",
    createdAt: "14/05/2026",
    projectName: "ABC Residency",
    description: "No description provided for this tower."
  }

  const [floorsData, setFloorsData] = useState([
    { id: 1, name: "Ground Floor", number: 0, status: "Active" },
    { id: 2, name: "First Floor", number: 1, status: "Active" },
    { id: 3, name: "Second Floor", number: 2, status: "Inactive" },
  ])

  const [isFloorDialogOpen, setIsFloorDialogOpen] = useState(false)

  const handleFloorStatusToggle = useCallback((id: number) => {
    setFloorsData((prev) =>
      prev.map((floor) =>
        floor.id === id
          ? { ...floor, status: floor.status === "Active" ? "Inactive" : "Active" }
          : floor
      )
    )
  }, [])

  const floorColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Floor Name",
      cell: ({ row }) => <span className="font-bold text-zinc-900">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "number",
      header: "Floor Number",
      cell: ({ row }) => (
        <span className="text-blue-600 font-bold px-2">
          {row.getValue("number")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <AppleSwitch 
              checked={status === "Active"} 
              onCheckedChange={() => handleFloorStatusToggle(row.original.id)}
              size="sm"
            />
            <span className={cn(
              "text-sm font-bold w-[70px]",
              status === "Active" ? "text-emerald-600" : "text-zinc-400"
            )}>
              {status}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
          <MoreVertical className="h-4 w-4" />
        </Button>
      ),
    },
  ], [handleFloorStatusToggle])

  return (
    <ContentLayout title="Tower Details">
      <div className="flex flex-col gap-6 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/project/${params.id}`}>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-zinc-200">
                <ArrowLeft className="h-5 w-5 text-zinc-600" />
              </Button>
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Tower Details</h1>
          </div>
          <Link href={`/project/${params.id}/tower/${params.towerId}/edit`}>
            <Button variant="outline" className="rounded-xl border-zinc-200 gap-2 h-10 px-4 bg-white shadow-sm hover:bg-zinc-50 text-zinc-600">
              <Edit3 className="h-4 w-4" />
              <span className="font-bold text-sm">Edit Tower</span>
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-zinc-100/80 p-1.5 rounded-2xl h-auto mb-6 flex justify-start border border-zinc-200/50 backdrop-blur-sm gap-2">
            <TabsTrigger 
              value="details" 
              className="rounded-xl px-12 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all flex-1 md:flex-none"
            >
              Tower Details
            </TabsTrigger>
            <TabsTrigger 
              value="floor" 
              className="rounded-xl px-12 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900 flex-1 md:flex-none"
            >
              Tower Floor
            </TabsTrigger>
            <TabsTrigger 
              value="flats" 
              className="rounded-xl px-12 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900 flex-1 md:flex-none"
            >
              Tower Flats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-12 shadow-sm space-y-12">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
                {/* Status */}
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-7 w-7 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</p>
                    <Badge className="bg-[#00A991] hover:bg-[#00A991] text-white border-none px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest shadow-md">
                      {tower.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-7 w-7 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Created At</p>
                    <p className="text-lg font-black text-zinc-900 tracking-tight">{tower.createdAt}</p>
                  </div>
                </div>

                {/* Project Name */}
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Building2 className="h-7 w-7 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Name</p>
                    <p className="text-lg font-black text-zinc-900 tracking-tight">{tower.projectName}</p>
                  </div>
                </div>

                {/* Tower Name */}
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Building className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tower Name</p>
                    <p className="text-lg font-black text-zinc-900 tracking-tight">{tower.name}</p>
                  </div>
                </div>

                {/* Tower Number */}
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Tag className="h-7 w-7 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tower Number</p>
                    <p className="text-lg font-black text-zinc-900 tracking-tight">{tower.number}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-12 border-t border-zinc-100 space-y-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Description</span>
                </div>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {tower.description}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="floor" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-black text-zinc-900">Tower Floors</h2>
                <Button 
                  onClick={() => setIsFloorDialogOpen(true)}
                  className="rounded-xl h-10 px-4 gap-2 bg-[#00A991] hover:bg-[#008F7A] text-white font-bold border-none shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Floor</span>
                </Button>
              </div>

              <DataTable columns={floorColumns} data={floorsData} searchKey="name" />
            </div>
          </TabsContent>

          <TabsContent value="flats" className="mt-0">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-12 text-center">
              <p className="text-zinc-400 font-bold">Tower Flats management content goes here.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Multiple Floors Dialog */}
        <Dialog open={isFloorDialogOpen} onOpenChange={setIsFloorDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Add Multiple Floors</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">How many floors to create?</label>
                <Input 
                  type="number"
                  placeholder="e.g. 20" 
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select defaultValue="Active">
                  <SelectTrigger className="h-14 rounded-2xl border-zinc-200 border-2 text-lg font-bold px-6">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-200 border-2">
                    <SelectItem value="Active" className="font-bold">Active</SelectItem>
                    <SelectItem value="Inactive" className="font-bold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 p-8 border-t border-zinc-100">
              <Button 
                variant="outline" 
                onClick={() => setIsFloorDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-900 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button 
                className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Create Floors
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}
