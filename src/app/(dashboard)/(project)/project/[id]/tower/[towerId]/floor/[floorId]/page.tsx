"use client"

import { useMemo, useCallback, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  Building2, 
  Building, 
  Tag, 
  ShieldCheck,
  Plus,
  MoreVertical,
  Trash
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
import { floorService } from "@/service/floorService"
import { useFlats } from "@/hooks/use-flats"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function FloorDetailsPage({ 
  params 
}: { 
  params: { id: string; towerId: string; floorId: string } 
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "details"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [floor, setFloor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const calledRef = useRef(false)

  const [hasLoadedFlats, setHasLoadedFlats] = useState(false)
  const {
    flats: flatsData,
    isLoading: isFlatsLoading,
    refetch: refetchFlats,
    addFlat,
    editFlat,
    removeFlat,
    toggleFlatStatus,
    page: flatPage,
    setPage: setFlatPage,
    search: flatSearch,
    setSearch: setFlatSearch,
    total: flatTotal,
    pageCount: flatPageCount,
  } = useFlats(params.floorId, { skipFetch: true })

  // Debounced search for flats
  useEffect(() => {
    if (activeTab !== "flat") return
    const delayDebounce = setTimeout(() => {
      refetchFlats({ search: flatSearch, page: flatPage })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [flatSearch, flatPage, activeTab, refetchFlats])

  const [flatCount, setFlatCount] = useState<number>()
  const [flatStatus, setFlatStatus] = useState<"active" | "inactive">("active")

  const [isFlatDialogOpen, setIsFlatDialogOpen] = useState(false)
  const [isEditFlatDialogOpen, setIsEditFlatDialogOpen] = useState(false)
  const [editingFlat, setEditingFlat] = useState<any>(null)
  const [editFlatName, setEditFlatName] = useState("")
  const [editFlatNumber, setEditFlatNumber] = useState("")
  const [editFlatStatus, setEditFlatStatus] = useState<"active" | "inactive">("active")

  const handleEditClick = useCallback((flat: any) => {
    setEditingFlat(flat)
    setEditFlatName(flat.name)
    setEditFlatNumber(flat.number)
    setEditFlatStatus(flat.status === "Active" ? "active" : "inactive")
    setIsEditFlatDialogOpen(true)
  }, [])

  const handleUpdateFlat = async () => {
    if (!editFlatName || !editFlatNumber) {
      toast.error("Please enter a valid flat name and number.")
      return
    }

    try {
      await editFlat(editingFlat.id, {
        flatName: editFlatName,
        flatNumber: String(editFlatNumber),
        status: editFlatStatus,
      })
      setIsEditFlatDialogOpen(false)
      setEditingFlat(null)
    } catch (err) {
      console.error(err)
    }
  }

  const flatsCalledRef = useRef(false)

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    router.push(`${pathname}?tab=${value}`, { scroll: false })
    if (value === "flat" && !hasLoadedFlats) {
      // Handled by debounced useEffect
      setHasLoadedFlats(true)
    }
  }, [hasLoadedFlats, pathname, router])

  useEffect(() => {
    if (initialTab === "flat" && !hasLoadedFlats && !flatsCalledRef.current) {
      flatsCalledRef.current = true
      refetchFlats()
      setHasLoadedFlats(true)
    }
  }, [initialTab, hasLoadedFlats, refetchFlats])

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const loadFloor = async () => {
      try {
        const response = await floorService.getFloorById(params.floorId)
        setFloor(response)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadFloor()
  }, [params.floorId])

  const handleFlatStatusToggle = useCallback(async (id: string) => {
    await toggleFlatStatus(id)
  }, [toggleFlatStatus])

  const handleFlatDelete = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to delete this flat?")) {
      try {
        await removeFlat(id)
      } catch (err) {
        console.error(err)
      }
    }
  }, [removeFlat])

  const handleCreateFlats = async () => {
    if (!flatCount || flatCount <= 0) {
      toast.error("Please enter a valid flat count.")
      return
    }

    try {
      const startNum = flatsData.length + 1
      const floorPrefix = floor ? String(floor.floorNumber) : "0"

      for (let i = 0; i < flatCount; i++) {
        const index = startNum + i
        const formattedNum = `${floorPrefix}${index < 10 ? "0" + index : index}`
        const name = `Flat ${formattedNum}`
        await addFlat({
          flatName: name,
          flatNumber: formattedNum,
          status: flatStatus,
        })
      }
      setIsFlatDialogOpen(false)
      setFlatCount(undefined)
    } catch (err) {
      console.error(err)
    }
  }

  const flatColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Flat Name",
      cell: ({ row }) => <span className="font-bold text-zinc-900">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "number",
      header: "Flat Number",
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
              onCheckedChange={() => handleFlatStatusToggle(row.original.id)}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-zinc-100 bg-white p-1">
            <DropdownMenuItem 
              onClick={() => handleEditClick(row.original)}
              className="gap-2 font-bold cursor-pointer text-zinc-700 py-2 rounded-lg"
            >
              <Edit3 className="h-4 w-4 text-zinc-500" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleFlatDelete(row.original.id)}
              className="gap-2 font-bold cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2 rounded-lg"
            >
              <Trash className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleFlatStatusToggle, handleFlatDelete, handleEditClick])

  return (
    <ContentLayout title="Floor Details">
      <div className="flex flex-col gap-6 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/project/${params.id}/tower/${params.towerId}?tab=floor`}>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-zinc-200">
                <ArrowLeft className="h-5 w-5 text-zinc-600" />
              </Button>
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Floor Details</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A991]"></div>
          </div>
        ) : !floor ? (
          <div className="bg-white border border-zinc-200 rounded-[32px] p-12 text-center shadow-sm">
            <p className="text-zinc-400 font-bold text-lg">Floor details not found or failed to load.</p>
            <Link href={`/project/${params.id}/tower/${params.towerId}?tab=floor`}>
              <Button className="mt-4 rounded-xl bg-[#00A991] hover:bg-[#008F7A] text-white font-bold">
                Back to Tower
              </Button>
            </Link>
          </div>
        ) : (
          /* Tabs */
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-zinc-100/80 p-1.5 rounded-2xl h-auto mb-6 flex justify-start border border-zinc-200/50 backdrop-blur-sm gap-2">
              <TabsTrigger 
                value="details" 
                className="rounded-xl px-12 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all flex-1 md:flex-none"
              >
                Floor Details
              </TabsTrigger>
              <TabsTrigger 
                value="flat" 
                className="rounded-xl px-12 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900 flex-1 md:flex-none"
              >
                Floor Flats
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
                        {(floor.status || "active").toUpperCase()}
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
                      <p className="text-lg font-black text-zinc-900 tracking-tight">
                        {floor.createdAt ? new Date(floor.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Tower Name */}
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="h-7 w-7 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tower Name</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">
                        {floor.towerId?.towerName || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Floor Name */}
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Building className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Floor Name</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">{floor.floorName}</p>
                    </div>
                  </div>

                  {/* Floor Number */}
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                      <Tag className="h-7 w-7 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Floor Number</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">{floor.floorNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flat" className="mt-0 focus-visible:outline-none">
              <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-black text-zinc-900">Floor Flats</h2>
                  <Button
                    onClick={() => setIsFlatDialogOpen(true)}
                    className="rounded-xl h-10 px-4 gap-2 bg-[#00A991] hover:bg-[#008F7A] text-white font-bold border-none shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
                  >
                    <span>Add Flat</span>
                  </Button>
                </div>

                <DataTable 
                  columns={flatColumns} 
                  data={flatsData} 
                  searchKey="name" 
                  isServerSide={true}
                  searchValue={flatSearch}
                  onSearchChange={setFlatSearch}
                  pageIndex={flatPage - 1}
                  pageSize={10}
                  pageCount={flatPageCount}
                  totalItems={flatTotal}
                  onPageChange={(page) => setFlatPage(page + 1)}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Add Multiple Flats Dialog */}
        <Dialog open={isFlatDialogOpen} onOpenChange={setIsFlatDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Add Flats</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">How many flats to create?</label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={flatCount ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFlatCount(val === "" ? undefined : Number(val));
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select
                  value={flatStatus}
                  onValueChange={(val) => setFlatStatus(val as "active" | "inactive")}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-zinc-200 border-2 text-lg font-bold px-6">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-200 border-2">
                    <SelectItem value="active" className="font-bold">Active</SelectItem>
                    <SelectItem value="inactive" className="font-bold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 p-8 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setIsFlatDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-900 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFlats}
                className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Create Flats
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Flat Dialog */}
        <Dialog open={isEditFlatDialogOpen} onOpenChange={setIsEditFlatDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Edit Flat</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Flat Name</label>
                <Input 
                  placeholder="e.g. Flat 101" 
                  value={editFlatName}
                  onChange={(e) => setEditFlatName(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Flat Number</label>
                <Input 
                  placeholder="e.g. 101" 
                  value={editFlatNumber}
                  onChange={(e) => setEditFlatNumber(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select 
                  value={editFlatStatus} 
                  onValueChange={(val) => setEditFlatStatus(val as "active" | "inactive")}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-zinc-200 border-2 text-lg font-bold px-6">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-200 border-2">
                    <SelectItem value="active" className="font-bold">Active</SelectItem>
                    <SelectItem value="inactive" className="font-bold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 p-8 border-t border-zinc-100">
              <Button 
                variant="outline" 
                onClick={() => setIsEditFlatDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-900 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateFlat}
                className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}
