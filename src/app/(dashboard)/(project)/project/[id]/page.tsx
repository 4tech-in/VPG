"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
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
import { useProjects } from "@/hooks/use-projects"
import { toast } from "sonner"
import { useTowers } from "@/hooks/use-towers"
import { useOutsides } from "@/hooks/use-outsides"
import { useProjectDocuments } from "@/hooks/use-project-documents"

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const { getProjectById } = useProjects(false)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const loadProject = async () => {
      try {
        const fetched = await getProjectById(params.id)
        setProject(fetched)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProject()
  }, [params.id, getProjectById])

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "details"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [hasLoadedTowers, setHasLoadedTowers] = useState(false)
  const [hasLoadedOutsides, setHasLoadedOutsides] = useState(false)
  const [hasLoadedDocuments, setHasLoadedDocuments] = useState(false)

  const {
    towers: towersData,
    isLoading: towersLoading,
    refetch: refetchTowers,
    addTower,
    editTower,
    removeTower,
    toggleTowerStatus,
    page: towerPage,
    setPage: setTowerPage,
    search: towerSearch,
    setSearch: setTowerSearch,
    total: towerTotal,
    pageCount: towerPageCount,
  } = useTowers(params.id, { skipFetch: true })

  // Debounced search for towers
  useEffect(() => {
    if (activeTab !== "towers") return
    const delayDebounce = setTimeout(() => {
      refetchTowers({ search: towerSearch, page: towerPage })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [towerSearch, towerPage, activeTab, refetchTowers])

  const {
    outsides: outsidesData,
    isLoading: outsidesLoading,
    refetch: refetchOutsides,
    addOutside,
    editOutside,
    removeOutside,
    toggleOutsideStatus,
    page: outsidePage,
    setPage: setOutsidePage,
    search: outsideSearch,
    setSearch: setOutsideSearch,
    total: outsideTotal,
    pageCount: outsidePageCount,
  } = useOutsides(params.id, { skipFetch: true })

  // Debounced search for outsides
  useEffect(() => {
    if (activeTab !== "non-tower") return
    const delayDebounce = setTimeout(() => {
      refetchOutsides({ search: outsideSearch, page: outsidePage })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [outsideSearch, outsidePage, activeTab, refetchOutsides])

  const {
    documents: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
    addDocument,
    editDocument,
    removeDocument,
    page: documentPage,
    setPage: setDocumentPage,
    search: documentSearch,
    setSearch: setDocumentSearch,
    total: documentTotal,
    pageCount: documentPageCount,
  } = useProjectDocuments(params.id, { skipFetch: true })

  // Debounced search for documents
  useEffect(() => {
    if (activeTab !== "documents") return
    const delayDebounce = setTimeout(() => {
      refetchDocuments({ search: documentSearch, page: documentPage })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [documentSearch, documentPage, activeTab, refetchDocuments])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    router.push(`${pathname}?tab=${value}`, { scroll: false })
    if (value === "towers" && !hasLoadedTowers) {
      // Handled by debounced useEffect
      setHasLoadedTowers(true)
    }
    if (value === "non-tower" && !hasLoadedOutsides) {
      // Handled by debounced useEffect
      setHasLoadedOutsides(true)
    }
    if (value === "documents" && !hasLoadedDocuments) {
      setHasLoadedDocuments(true)
    }
  }, [hasLoadedTowers, hasLoadedOutsides, hasLoadedDocuments, pathname, router])

  // Automatically fetch towers/outsides/documents on mount if active
  useEffect(() => {
    if (initialTab === "towers" && !hasLoadedTowers && !towersCalledRef.current) {
      towersCalledRef.current = true
      refetchTowers()
      setHasLoadedTowers(true)
    }
    if (initialTab === "non-tower" && !hasLoadedOutsides && !outsidesCalledRef.current) {
      outsidesCalledRef.current = true
      refetchOutsides()
      setHasLoadedOutsides(true)
    }
    if (initialTab === "documents" && !hasLoadedDocuments && !documentsCalledRef.current) {
      documentsCalledRef.current = true
      refetchDocuments()
      setHasLoadedDocuments(true)
    }
  }, [initialTab, hasLoadedTowers, refetchTowers, hasLoadedOutsides, refetchOutsides, hasLoadedDocuments, refetchDocuments])

  const towersCalledRef = useRef(false)
  const outsidesCalledRef = useRef(false)
  const documentsCalledRef = useRef(false)

  const [addTowerName, setAddTowerName] = useState("")
  const [addTowerNumber, setAddTowerNumber] = useState("")
  const [addTowerStatus, setAddTowerStatus] = useState("Active")

  const [editTowerName, setEditTowerName] = useState("")
  const [editTowerNumber, setEditTowerNumber] = useState("")
  const [editTowerStatus, setEditTowerStatus] = useState("Active")

  const [isTowerDialogOpen, setIsTowerDialogOpen] = useState(false)
  const [isEditTowerDialogOpen, setIsEditTowerDialogOpen] = useState(false)
  const [editingTower, setEditingTower] = useState<any>(null)

  const [addAreaName, setAddAreaName] = useState("")
  const [addAreaStatus, setAddAreaStatus] = useState("Active")

  const [editAreaName, setEditAreaName] = useState("")
  const [editAreaStatus, setEditAreaStatus] = useState("Active")

  const [isEditAreaDialogOpen, setIsEditAreaDialogOpen] = useState(false)
  const [isAddAreaDialogOpen, setIsAddAreaDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<any>(null)

  const [addDocTitle, setAddDocTitle] = useState("")
  const [addDocFiles, setAddDocFiles] = useState<File[]>([])
  const [addDocNote, setAddDocNote] = useState("")

  const [editDocTitle, setEditDocTitle] = useState("")
  const [editDocFiles, setEditDocFiles] = useState<File[]>([])
  const [editDocNote, setEditDocNote] = useState("")

  const [isAddDocDialogOpen, setIsAddDocDialogOpen] = useState(false)
  const [isEditDocDialogOpen, setIsEditDocDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)

  const handleTowerStatusToggle = useCallback(async (id: string) => {
    try {
      await toggleTowerStatus(id)
    } catch (err) { }
  }, [toggleTowerStatus])

  const handleEditTowerClick = (tower: any) => {
    setEditingTower(tower)
    setEditTowerName(tower.name)
    setEditTowerNumber(tower.number)
    setEditTowerStatus(tower.status)
    setIsEditTowerDialogOpen(true)
  }

  const handleAddTowerSubmit = async () => {
    if (!addTowerName.trim() || !addTowerNumber.trim()) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      await addTower({
        towerName: addTowerName,
        towerNumber: addTowerNumber,
        status: addTowerStatus === "Active" ? "active" : "inactive"
      })
      setAddTowerName("")
      setAddTowerNumber("")
      setAddTowerStatus("Active")
      setIsTowerDialogOpen(false)
    } catch (err) { }
  }

  const handleEditTowerSubmit = async () => {
    if (!editingTower) return
    if (!editTowerName.trim() || !editTowerNumber.trim()) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      await editTower(editingTower.id, {
        towerName: editTowerName,
        towerNumber: editTowerNumber,
        status: editTowerStatus === "Active" ? "active" : "inactive"
      })
      setIsEditTowerDialogOpen(false)
    } catch (err) { }
  }

  const handleAddAreaSubmit = async () => {
    if (!addAreaName.trim()) {
      toast.error("Area Name is required")
      return
    }
    try {
      await addOutside({
        outsideName: addAreaName,
        status: addAreaStatus === "Active" ? "active" : "inactive"
      })
      setAddAreaName("")
      setAddAreaStatus("Active")
      setIsAddAreaDialogOpen(false)
    } catch (err) { }
  }

  const handleEditAreaClick = (area: any) => {
    setEditingArea(area)
    setEditAreaName(area.name)
    setEditAreaStatus(area.status)
    setIsEditAreaDialogOpen(true)
  }

  const handleEditAreaSubmit = async () => {
    if (!editingArea) return
    if (!editAreaName.trim()) {
      toast.error("Area Name is required")
      return
    }
    try {
      await editOutside(editingArea.id, {
        outsideName: editAreaName,
        status: editAreaStatus === "Active" ? "active" : "inactive"
      })
      setIsEditAreaDialogOpen(false)
    } catch (err) { }
  }

  const handleAreaDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this area?")) {
      try {
        await removeOutside(id)
      } catch (err) { }
    }
  }

  const handleAddDocSubmit = async () => {
    if (!addDocTitle.trim() || addDocFiles.length === 0) {
      toast.error("Please provide a title and at least one file")
      return
    }
    try {
      const formData = new FormData()
      formData.append("title", addDocTitle)
      if (addDocNote) formData.append("note", addDocNote)
      addDocFiles.forEach(file => {
        formData.append("files", file)
      })

      await addDocument(formData)
      setAddDocTitle("")
      setAddDocFiles([])
      setAddDocNote("")
      setIsAddDocDialogOpen(false)
    } catch (err) { }
  }

  const handleEditDocClick = (doc: any) => {
    setEditingDoc(doc)
    setEditDocTitle(doc.title)
    setEditDocFiles([])
    setEditDocNote(doc.note || "")
    setIsEditDocDialogOpen(true)
  }

  const handleEditDocSubmit = async () => {
    if (!editingDoc) return
    if (!editDocTitle.trim()) {
      toast.error("Please provide a title")
      return
    }
    try {
      const formData = new FormData()
      formData.append("title", editDocTitle)
      if (editDocNote) formData.append("note", editDocNote)
      if (editDocFiles.length > 0) {
        editDocFiles.forEach(file => {
          formData.append("files", file)
        })
      }

      await editDocument(editingDoc.id, formData)
      setIsEditDocDialogOpen(false)
    } catch (err) { }
  }

  const handleDocDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await removeDocument(id)
      } catch (err) { }
    }
  }

  const towerColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Tower Name",
      cell: ({ row }) => (
        <Link
          href={`/project/${params.id}/tower/${row.original.id}`}
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
          href={`/project/${params.id}/tower/${row.original.id}`}
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
          <Link href={`/project/${params.id}/tower/${row.original.id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditTowerClick(row.original)}
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Are you sure you want to delete this tower?")) {
                removeTower(row.original.id)
              }
            }}
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleTowerStatusToggle, handleEditTowerClick, removeTower, params.id])

  const nonTowerColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Area Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{row.getValue("name")}</span>
            {row.original.towerName && (
              <span className="text-[10px] text-zinc-400 font-bold">
                Tower: {row.original.towerName}
              </span>
            )}
          </div>
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
            onClick={() => handleEditAreaClick(row.original)}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAreaDelete(row.original.id)}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEditAreaClick, handleAreaDelete])

  const documentColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900">{row.getValue("title")}</span>
          {row.original.note && (
            <span className="text-xs text-zinc-500 font-medium mt-1">
              Note: {row.original.note}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "files",
      header: "Files",
      cell: ({ row }) => {
        const files = row.original.files;
        if (!files || files.length === 0) return <span className="text-zinc-400 text-sm">No File</span>
        
        const backendBase = process.env.NEXT_PUBLIC_BASE_URL?.split('/api')[0] || 'http://localhost:3001'

        return (
          <div className="flex flex-col gap-1">
            {files.map((f: any, idx: number) => (
              <a key={idx} href={`${backendBase}${f.filePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {f.fileName}
              </a>
            ))}
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
            onClick={() => handleEditDocClick(row.original)}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDocDelete(row.original.id)}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEditDocClick, handleDocDelete])

  if (isLoading) {
    return (
      <ContentLayout title="Project Details">
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-zinc-50/50">
          <div className="text-zinc-400 font-bold">Loading project details...</div>
        </div>
      </ContentLayout>
    )
  }

  if (!project) {
    return (
      <ContentLayout title="Project Details">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-zinc-50/50 gap-4">
          <div className="text-red-500 font-bold">Project not found</div>
          <Link href="/project">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </ContentLayout>
    )
  }

  const formattedDate = project.startDate instanceof Date
    ? project.startDate.toLocaleDateString()
    : new Date(project.startDate).toLocaleDateString()

  const addressParts = [
    project.streetAddress,
    project.city,
    project.state,
    project.country,
    project.postalCode
  ].filter(Boolean)
  const completeAddress = addressParts.length > 0 ? addressParts.join(", ") : "N/A"

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
          {/* <Button variant="outline" className="rounded-xl border-zinc-200 gap-2 h-10 px-4 bg-white shadow-sm hover:bg-zinc-50">
            <Edit3 className="h-4 w-4" />
            <span className="font-bold text-sm">Edit Project</span>
          </Button> */}
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue="details" className="w-full">
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
                    <p className="text-lg font-black text-zinc-900">{formattedDate}</p>
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
                    <p className="text-lg font-black text-zinc-900">{completeAddress}</p>
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
                      {project.notes || "No additional notes provided."}
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
                  <span>Add Tower</span>
                </Button>
              </div>

              <DataTable 
                columns={towerColumns} 
                data={towersData} 
                searchKey="name" 
                isServerSide={true}
                searchValue={towerSearch}
                onSearchChange={setTowerSearch}
                pageIndex={towerPage - 1}
                pageSize={10}
                pageCount={towerPageCount}
                totalItems={towerTotal}
                onPageChange={(page) => setTowerPage(page + 1)}
              />
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
                  <Button
                    onClick={() => setIsAddAreaDialogOpen(true)}
                    className="rounded-xl h-10 px-4 gap-2 bg-[#00A991] hover:bg-[#008F7A] text-white font-bold border-none shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
                  >
                    <span>Add Non Tower Area</span>
                  </Button>
                </div>
              </div>

              <DataTable 
                columns={nonTowerColumns} 
                data={outsidesData} 
                searchKey="name" 
                isServerSide={true}
                searchValue={outsideSearch}
                onSearchChange={setOutsideSearch}
                pageIndex={outsidePage - 1}
                pageSize={10}
                pageCount={outsidePageCount}
                totalItems={outsideTotal}
                onPageChange={(page) => setOutsidePage(page + 1)}
              />
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
            <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight">Project Documents</h2>
                  <p className="text-sm font-medium text-zinc-500">Manage documents for this project</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsAddDocDialogOpen(true)}
                    className="rounded-xl h-10 px-4 gap-2 bg-[#00A991] hover:bg-[#008F7A] text-white font-bold border-none shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Upload Document</span>
                  </Button>
                </div>
              </div>

              {documentsData?.length > 0 ? (
                <DataTable 
                  columns={documentColumns} 
                  data={documentsData} 
                  searchKey="title" 
                  isServerSide={true}
                  searchValue={documentSearch}
                  onSearchChange={setDocumentSearch}
                  pageIndex={documentPage - 1}
                  pageSize={10}
                  pageCount={documentPageCount}
                  totalItems={documentTotal}
                  onPageChange={(page) => setDocumentPage(page + 1)}
                />
              ) : (
                <div className="border-2 border-dashed border-zinc-200 rounded-[24px] p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-50 flex items-center justify-center shadow-inner">
                    <FileStack className="h-8 w-8 text-zinc-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight">No Documents</h3>
                    <p className="text-zinc-500 font-medium">Upload a document to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="structure" className="mt-0 focus-visible:outline-none">
            <ProjectStructure />
          </TabsContent>
        </Tabs>

        {/* Add Tower Dialog */}
        <Dialog open={isTowerDialogOpen} onOpenChange={setIsTowerDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 rounded-[32px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Add New Tower</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Tower Name</label>
                <Input
                  placeholder="e.g. Tower A"
                  value={addTowerName}
                  onChange={(e) => setAddTowerName(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Tower Number</label>
                <Input
                  placeholder="e.g. A"
                  value={addTowerNumber}
                  onChange={(e) => setAddTowerNumber(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Status</label>
                <Select value={addTowerStatus} onValueChange={setAddTowerStatus}>
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
            <div className="flex items-center justify-end gap-4 p-8 bg-zinc-50/50 border-t border-zinc-100">
              <Button
                variant="ghost"
                onClick={() => setIsTowerDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTowerSubmit}
                className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Create Tower
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
                  value={editTowerName}
                  onChange={(e) => setEditTowerName(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Tower Number</label>
                <Input
                  placeholder="e.g. A1"
                  value={editTowerNumber}
                  onChange={(e) => setEditTowerNumber(e.target.value)}
                  className="h-14 rounded-2xl border-zinc-200 border-2 focus-visible:ring-zinc-200 text-lg font-bold transition-all px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Status</label>
                <Select value={editTowerStatus} onValueChange={setEditTowerStatus}>
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
                onClick={handleEditTowerSubmit}
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
                  value={editAreaName}
                  onChange={(e) => setEditAreaName(e.target.value)}
                  placeholder="e.g. Swimming Pool"
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select value={editAreaStatus} onValueChange={setEditAreaStatus}>
                  <SelectTrigger className="h-12 rounded-xl border-zinc-200 border-2 font-bold px-4">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 bg-white">
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
                onClick={handleEditAreaSubmit}
                className="rounded-xl h-11 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
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
                  value={addAreaName}
                  onChange={(e) => setAddAreaName(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Status</label>
                <Select value={addAreaStatus} onValueChange={setAddAreaStatus}>
                  <SelectTrigger className="h-12 rounded-xl border-zinc-200 border-2 font-bold px-4">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 bg-white">
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
                onClick={handleAddAreaSubmit}
                className="rounded-xl h-11 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Add Area
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Document Dialog */}
        <Dialog open={isAddDocDialogOpen} onOpenChange={setIsAddDocDialogOpen}>
          <DialogContent className="sm:max-w-[450px] p-0 rounded-[24px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Document Title</label>
                <Input
                  placeholder="e.g. Site Plan"
                  value={addDocTitle}
                  onChange={(e) => setAddDocTitle(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Document Files</label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const filesArray = Array.from(e.target.files || [])
                      setAddDocFiles(prev => [...prev, ...filesArray])
                      e.target.value = ''
                    }}
                    className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {addDocFiles.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 bg-zinc-50 rounded-xl p-3 border border-zinc-100 max-h-32 overflow-y-auto">
                      {addDocFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-100 shadow-sm">
                          <span className="text-sm font-medium text-zinc-700 truncate mr-2">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => setAddDocFiles(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Note (Optional)</label>
                <Input
                  placeholder="e.g. Approved by management"
                  value={addDocNote}
                  onChange={(e) => setAddDocNote(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-6 border-t border-zinc-100 bg-white">
              <Button
                variant="outline"
                onClick={() => setIsAddDocDialogOpen(false)}
                className="rounded-xl h-11 px-8 font-black text-zinc-900 border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddDocSubmit}
                className="rounded-xl h-11 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDocDialogOpen} onOpenChange={setIsEditDocDialogOpen}>
          <DialogContent className="sm:max-w-[450px] p-0 rounded-[24px] border-none shadow-2xl overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Edit Document</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Document Title</label>
                <Input
                  value={editDocTitle}
                  onChange={(e) => setEditDocTitle(e.target.value)}
                  placeholder="e.g. Site Plan"
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Document Files (Leave empty to keep existing)</label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const filesArray = Array.from(e.target.files || [])
                      setEditDocFiles(prev => [...prev, ...filesArray])
                      e.target.value = ''
                    }}
                    className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {editDocFiles.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 bg-zinc-50 rounded-xl p-3 border border-zinc-100 max-h-32 overflow-y-auto">
                      {editDocFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-100 shadow-sm">
                          <span className="text-sm font-medium text-zinc-700 truncate mr-2">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => setEditDocFiles(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editDocFiles.length === 0 && editingDoc?.files && editingDoc.files.length > 0 && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Current files will be kept if no new files are uploaded.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-600">Note (Optional)</label>
                <Input
                  value={editDocNote}
                  onChange={(e) => setEditDocNote(e.target.value)}
                  placeholder="e.g. Approved by management"
                  className="h-12 rounded-xl border-zinc-200 border-2 focus-visible:ring-[#00A991]/20 focus-visible:border-[#00A991] font-bold px-4"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-6 border-t border-zinc-100 bg-white">
              <Button
                variant="outline"
                onClick={() => setIsEditDocDialogOpen(false)}
                className="rounded-xl h-11 px-8 font-black text-zinc-900 border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditDocSubmit}
                className="rounded-xl h-11 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
              >
                Update
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}
