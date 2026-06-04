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
  FileText,
  Clock,
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
import { towerService } from "@/service/towerService"
import { useFloors } from "@/hooks/use-floors"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const getFloorName = (num: number): string => {
  if (num === 0) return "Ground Floor"
  if (num === 1) return "First Floor"
  if (num === 2) return "Second Floor"
  if (num === 3) return "Third Floor"

  const s = ["th", "st", "nd", "rd"]
  const v = num % 100
  const suffix = s[(v - 20) % 10] || s[v] || s[0]
  return `${num}${suffix} Floor`
}

export default function TowerDetailsPage({
  params
}: {
  params: { id: string; towerId: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "details"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [tower, setTower] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const calledRef = useRef(false)

  const [hasLoadedFloors, setHasLoadedFloors] = useState(false)
  const {
    floors: floorsData,
    isLoading: isFloorsLoading,
    refetch: refetchFloors,
    addFloor,
    editFloor,
    removeFloor,
    toggleFloorStatus,
    page: floorPage,
    setPage: setFloorPage,
    search: floorSearch,
    setSearch: setFloorSearch,
    total: floorTotal,
    pageCount: floorPageCount,
  } = useFloors(params.towerId, { skipFetch: true })

  // Debounced search for floors
  useEffect(() => {
    if (activeTab !== "floor") return
    const delayDebounce = setTimeout(() => {
      refetchFloors({ search: floorSearch, page: floorPage })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [floorSearch, floorPage, activeTab, refetchFloors])

  const [floorCount, setFloorCount] = useState<number>()
  const [floorStatus, setFloorStatus] = useState<"active" | "inactive">("active")

  const [isEditFloorDialogOpen, setIsEditFloorDialogOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState<any>(null)
  const [editFloorName, setEditFloorName] = useState("")
  const [editFloorNumber, setEditFloorNumber] = useState<number>()
  const [editFloorStatus, setEditFloorStatus] = useState<"active" | "inactive">("active")

  const handleEditClick = useCallback((floor: any) => {
    setEditingFloor(floor)
    setEditFloorName(floor.name)
    setEditFloorNumber(floor.number)
    setEditFloorStatus(floor.status === "Active" ? "active" : "inactive")
    setIsEditFloorDialogOpen(true)
  }, [])

  const handleUpdateFloor = async () => {
    if (!editFloorName || editFloorNumber === undefined || editFloorNumber < 0) {
      toast.error("Please enter a valid floor name and number.")
      return
    }

    try {
      await editFloor(editingFloor.id, {
        floorName: editFloorName,
        floorNumber: String(editFloorNumber),
        status: editFloorStatus,
      })
      setIsEditFloorDialogOpen(false)
      setEditingFloor(null)
    } catch (err) {
      console.error(err)
    }
  }

  const floorsCalledRef = useRef(false)

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    router.push(`${pathname}?tab=${value}`, { scroll: false })
    if (value === "floor" && !hasLoadedFloors) {
      // Handled by debounced useEffect
      setHasLoadedFloors(true)
    }
  }, [hasLoadedFloors, pathname, router])

  useEffect(() => {
    if (initialTab === "floor" && !hasLoadedFloors && !floorsCalledRef.current) {
      floorsCalledRef.current = true
      refetchFloors()
      setHasLoadedFloors(true)
    }
  }, [initialTab, hasLoadedFloors, refetchFloors])

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const loadTower = async () => {
      try {
        const response = await towerService.getTowerById(params.towerId)
        setTower(response)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadTower()
  }, [params.towerId])

  const [isFloorDialogOpen, setIsFloorDialogOpen] = useState(false)

  const handleFloorStatusToggle = useCallback(async (id: string) => {
    await toggleFloorStatus(id)
  }, [toggleFloorStatus])

  const handleFloorDelete = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to delete this floor?")) {
      try {
        await removeFloor(id)
      } catch (err) {
        console.error(err)
      }
    }
  }, [removeFloor])

  const handleCreateFloors = async () => {
    if (!floorCount || floorCount <= 0) {
      toast.error("Please enter a valid floor count.")
      return
    }

    try {
      const maxFloorNum = floorsData.reduce((max, f) => (f.number > max ? f.number : max), -1)
      const startNum = maxFloorNum + 1

      for (let i = 0; i < floorCount; i++) {
        const num = startNum + i
        const name = getFloorName(num)
        await addFloor({
          floorName: name,
          floorNumber: num,
          status: floorStatus,
        })
      }
      setIsFloorDialogOpen(false)
      setFloorCount(undefined)
    } catch (err) {
      console.error(err)
    }
  }

  const floorColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Floor Name",
      cell: ({ row }) => (
        <Link
          href={`/project/${params.id}/tower/${params.towerId}/floor/${row.original.id}`}
          className="font-bold text-[#00A991] hover:underline cursor-pointer"
        >
          {row.getValue("name")}
        </Link>
      ),
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
              onClick={() => handleFloorDelete(row.original.id)}
              className="gap-2 font-bold cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2 rounded-lg"
            >
              <Trash className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleFloorStatusToggle, handleFloorDelete, handleEditClick, params.id, params.towerId])

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

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A991]"></div>
          </div>
        ) : !tower ? (
          <div className="bg-white border border-zinc-200 rounded-[32px] p-12 text-center shadow-sm">
            <p className="text-zinc-400 font-bold text-lg">Tower details not found or failed to load.</p>
            <Link href={`/project/${params.id}`}>
              <Button className="mt-4 rounded-xl bg-[#00A991] hover:bg-[#008F7A] text-white font-bold">
                Back to Project
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
                Tower Details
              </TabsTrigger>
              <TabsTrigger
                value="floor"
                className="rounded-xl px-12 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-sm transition-all text-zinc-500 hover:text-zinc-900 flex-1 md:flex-none"
              >
                Tower Floor
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
                        {(tower.status || "active").toUpperCase()}
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
                        {tower.createdAt ? new Date(tower.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Project Name */}
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="h-7 w-7 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Name</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">
                        {tower.projectId?.projectName || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Tower Name */}
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Building className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tower Name</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">{tower.towerName}</p>
                    </div>
                  </div>

                  {/* Tower Number */}
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                      <Tag className="h-7 w-7 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tower Number</p>
                      <p className="text-lg font-black text-zinc-900 tracking-tight">{tower.towerNumber}</p>
                    </div>
                  </div>
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
                    <span>Add Floor</span>
                  </Button>
                </div>

                <DataTable
                  columns={floorColumns}
                  data={floorsData}
                  searchKey="name"
                  isServerSide={true}
                  searchValue={floorSearch}
                  onSearchChange={setFloorSearch}
                  pageIndex={floorPage - 1}
                  pageSize={10}
                  pageCount={floorPageCount}
                  totalItems={floorTotal}
                  onPageChange={(page) => setFloorPage(page + 1)}
                />
              </div>
            </TabsContent>

          </Tabs>
        )}

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
                  value={floorCount ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFloorCount(val === "" ? undefined : Number(val));
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select
                  value={floorStatus}
                  onValueChange={(val) => setFloorStatus(val as "active" | "inactive")}
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
                onClick={() => setIsFloorDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-900 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFloors}
                className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Create Floors
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Floor Dialog */}
        <Dialog open={isEditFloorDialogOpen} onOpenChange={setIsEditFloorDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Edit Floor</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Floor Name</label>
                <Input
                  placeholder="e.g. Ground Floor"
                  value={editFloorName}
                  onChange={(e) => setEditFloorName(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Floor Number</label>
                <Input
                  type="number"
                  placeholder="e.g. 0"
                  value={editFloorNumber ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditFloorNumber(val === "" ? undefined : Number(val));
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select
                  value={editFloorStatus}
                  onValueChange={(val) => setEditFloorStatus(val as "active" | "inactive")}
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
                onClick={() => setIsEditFloorDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-900 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateFloor}
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
