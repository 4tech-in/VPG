"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  MapPin, 
  FileText, 
  Layout, 
  Building2, 
  HardHat, 
  FileStack, 
  Settings2, 
  Search, 
  Plus, 
  MoreVertical,
  Eye,
  Trash,
  LayoutGrid
} from "lucide-react"
import { ProjectStructure } from "@/components/project-structure"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
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

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, you'd fetch this data based on the ID
  const project = {
    id: params.id,
    name: "Marbella Grande",
    location: "Sector 82, Mohali",
    status: "Active",
    startDate: "01/01/2023",
    description: "No additional notes provided."
  }
  const [towersData, setTowersData] = useState([
    { id: 1, name: "Tower A", number: 1, status: "Active" },
    { id: 2, name: "Tower B", number: 2, status: "Active" },
    { id: 3, name: "Tower C", number: 3, status: "Inactive" },
  ])

  const [isTowerDialogOpen, setIsTowerDialogOpen] = useState(false)
  const [isEditTowerDialogOpen, setIsEditTowerDialogOpen] = useState(false)
  const [editingTower, setEditingTower] = useState<any>(null)

  const [areasData, setAreasData] = useState([
    { id: 1, name: "Swimming Pool", status: "Active" },
    { id: 2, name: "Central Garden", status: "Active" },
    { id: 3, name: "Clubhouse", status: "Active" },
    { id: 4, name: "Visitor Parking", status: "Active" },
    { id: 5, name: "Jogging Track", status: "Active" },
  ])

  const [isEditAreaDialogOpen, setIsEditAreaDialogOpen] = useState(false)
  const [isAddAreaDialogOpen, setIsAddAreaDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<any>(null)

  const handleTowerStatusToggle = useCallback((id: number) => {
    setTowersData((prev) =>
      prev.map((tower) =>
        tower.id === id
          ? { ...tower, status: tower.status === "Active" ? "Inactive" : "Active" }
          : tower
      )
    )
  }, [])

  const towerColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Tower Name",
      cell: ({ row }) => (
        <Link 
          href={`/project/${project.id}/tower/${row.original.id}`}
          className="font-bold text-zinc-900 hover:text-primary transition-colors"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "number",
      header: "Tower Number",
      cell: ({ row }) => (
        <Link 
          href={`/project/${project.id}/tower/${row.original.id}`}
          className="text-blue-600 font-bold hover:underline cursor-pointer"
        >
          {row.getValue("number")}
        </Link>
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
              onCheckedChange={() => handleTowerStatusToggle(row.original.id)}
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/project/${project.id}/tower/${row.original.id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setEditingTower(row.original)
              setIsEditTowerDialogOpen(true)
            }}
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleTowerStatusToggle])

  const nonTowerColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Area Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="font-bold text-zinc-900">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              status === "Active" ? "bg-emerald-500" : "bg-zinc-300"
            )} />
            <span className={cn(
              "text-sm font-bold",
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setEditingArea(row.original)
              setIsEditAreaDialogOpen(true)
            }}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <ContentLayout title="Project Details">
      <div className="flex flex-col gap-6 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
        {/* Top Navigation / Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/project">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-zinc-200">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Project Details</h1>
          </div>
          <Button variant="outline" className="rounded-xl border-zinc-200 gap-2 h-10 px-4 bg-white shadow-sm hover:bg-zinc-50">
            <Edit3 className="h-4 w-4" />
            <span className="font-bold text-sm">Edit Project</span>
          </Button>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-zinc-100/80 p-1.5 rounded-2xl h-auto mb-6 flex-wrap justify-start border border-zinc-200/50 backdrop-blur-sm">
            <TabsTrigger 
              value="details" 
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all"
            >
              Project Details
            </TabsTrigger>
            <TabsTrigger 
              value="towers" 
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900"
            >
              Towers
            </TabsTrigger>
            <TabsTrigger 
              value="non-tower" 
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900"
            >
              Non Tower Area
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900"
            >
              Project Documents
            </TabsTrigger>
            <TabsTrigger 
              value="structure" 
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900"
            >
              Structure
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-8 sm:p-12 shadow-sm relative overflow-hidden group">
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
              
              <div className="space-y-12">
                {/* Status Section */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Status:</span>
                  <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-none px-4 py-1 rounded-full text-xs font-black tracking-wide shadow-lg shadow-emerald-500/20">
                    {project.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Primary Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary/60">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Start Date</span>
                    </div>
                    <p className="text-lg font-black text-zinc-900">{project.startDate}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary/60">
                      <Layout className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Project Name</span>
                    </div>
                    <p className="text-lg font-black text-zinc-900">{project.name}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary/60">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Address</span>
                    </div>
                    <p className="text-lg font-black text-zinc-900">{project.location}</p>
                  </div>
                </div>

                {/* Description Section */}
                <div className="space-y-4 pt-8 border-t border-zinc-100">
                  <div className="flex items-center gap-2 text-primary/60">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Description</span>
                  </div>
                  <div className="bg-zinc-50/50 rounded-2xl p-6 border border-zinc-100/50">
                    <p className="text-zinc-600 font-medium leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Placeholder contents for other tabs to make it feel complete */}
          <TabsContent value="towers" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm overflow-hidden">
              {/* Towers Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-black text-zinc-900">Project Towers</h2>
                <Button 
                  onClick={() => setIsTowerDialogOpen(true)}
                  className="rounded-xl h-10 px-4 gap-2 bg-[#00A991] hover:bg-[#008F7A] text-white font-bold border-none shadow-lg shadow-[#00A991]/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tower</span>
                </Button>
              </div>

              <DataTable columns={towerColumns} data={towersData} searchKey="name" />
            </div>
          </TabsContent>

          <TabsContent value="non-tower" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight">Non Tower Area</h2>
                  <p className="text-sm font-medium text-zinc-500">Manage general areas and amenities for this project</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Search areas..." 
                      className="h-10 w-[250px] pl-10 rounded-xl border-zinc-200 focus-visible:ring-primary/20 bg-white shadow-sm"
                    />
                  </div>
                  <Button 
                    onClick={() => setIsAddAreaDialogOpen(true)}
                    className="rounded-xl h-10 px-4 gap-2 bg-[#00A991] hover:bg-[#008F7A] text-white font-bold border-none shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Non Tower Area</span>
                  </Button>
                </div>
              </div>

              <DataTable columns={nonTowerColumns} data={areasData} searchKey="name" />
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[32px] p-20 text-center flex flex-col items-center justify-center space-y-6 shadow-sm">
              <div className="h-20 w-20 rounded-3xl bg-zinc-50 flex items-center justify-center shadow-inner">
                <FileStack className="h-10 w-10 text-zinc-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Project Documents</h3>
                <p className="text-zinc-500 font-medium max-w-xs mx-auto">No documents uploaded for this project yet.</p>
              </div>
              <Button className="rounded-2xl h-14 px-10 gap-3 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95">
                <Plus className="h-5 w-5" />
                <span>Upload Document</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="mt-0 focus-visible:outline-none">
            <ProjectStructure />
          </TabsContent>
        </Tabs>

        {/* Bulk Create Towers Dialog */}
        <Dialog open={isTowerDialogOpen} onOpenChange={setIsTowerDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Bulk Create Towers</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">How many towers would you like to create?</label>
                <Input 
                  type="number"
                  placeholder="e.g. 10" 
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 p-8 bg-zinc-50/50 border-t border-zinc-100">
              <Button 
                variant="ghost" 
                onClick={() => setIsTowerDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
              >
                Cancel
              </Button>
              <Button 
                className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Create Towers
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Tower Dialog */}
        <Dialog open={isEditTowerDialogOpen} onOpenChange={setIsEditTowerDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Edit Tower</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Tower Name</label>
                <Input 
                  placeholder="e.g. Tower A" 
                  defaultValue={editingTower?.name}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Tower Number</label>
                <Input 
                  placeholder="e.g. A1" 
                  defaultValue={editingTower?.number}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-zinc-200 text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Status</label>
                <Select defaultValue={editingTower?.status}>
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
                onClick={() => setIsEditTowerDialogOpen(false)}
                className="rounded-2xl h-14 px-10 font-black text-zinc-900 border-zinc-200 border-2 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button 
                className="rounded-2xl h-14 px-10 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Update Tower
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Non Tower Area Dialog */}
        <Dialog open={isEditAreaDialogOpen} onOpenChange={setIsEditAreaDialogOpen}>
          <DialogContent className="sm:max-w-[450px] p-0 rounded-[24px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Edit Non Tower Area</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Area Name</label>
                <Input 
                  defaultValue={editingArea?.name}
                  placeholder="e.g. Swimming Pool" 
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select defaultValue={editingArea?.status}>
                  <SelectTrigger className="h-12 rounded-xl border-zinc-200 border-2 font-bold px-4">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200">
                    <SelectItem value="Active" className="font-bold">Active</SelectItem>
                    <SelectItem value="Inactive" className="font-bold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-6 border-t border-zinc-100 bg-white">
              <Button 
                variant="outline" 
                onClick={() => setIsEditAreaDialogOpen(false)}
                className="rounded-xl h-11 px-8 font-black text-zinc-900 border-zinc-200"
              >
                Cancel
              </Button>
              <Button 
                className="rounded-xl h-11 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all"
              >
                Update Area
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Non Tower Area Dialog */}
        <Dialog open={isAddAreaDialogOpen} onOpenChange={setIsAddAreaDialogOpen}>
          <DialogContent className="sm:max-w-[450px] p-0 rounded-[24px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Add Non Tower Area</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Area Name</label>
                <Input 
                  placeholder="e.g. Swimming Pool, Garden" 
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select defaultValue="Active">
                  <SelectTrigger className="h-12 rounded-xl border-zinc-200 border-2 font-bold px-4">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200">
                    <SelectItem value="Active" className="font-bold">Active</SelectItem>
                    <SelectItem value="Inactive" className="font-bold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-6 border-t border-zinc-100 bg-white">
              <Button 
                variant="outline" 
                onClick={() => setIsAddAreaDialogOpen(false)}
                className="rounded-xl h-11 px-8 font-black text-zinc-900 border-zinc-200"
              >
                Cancel
              </Button>
              <Button 
                className="rounded-xl h-11 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Add Area
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}
