"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Loader2, Search, Eye, Wrench, RotateCcw } from "lucide-react"
import { assetService } from "@/service/assets.api"
import { projectService } from "@/service/projectService"
import { vendorService, ApiVendor } from "@/service/vendorService"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Project = { _id?: string; id?: string; projectName?: string; name?: string }

export default function AssetMaintenancesPage() {
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [vendors, setVendors] = useState<ApiVendor[]>([])
  const [availableAssets, setAvailableAssets] = useState<any[]>([])
  const [allAssets, setAllAssets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [returnProjectId, setReturnProjectId] = useState("")
  const [returnAssetId, setReturnAssetId] = useState("")
  const [maintenanceAssetId, setMaintenanceAssetId] = useState("")
  const [maintenanceProjectId, setMaintenanceProjectId] = useState("")
  const [maintenanceVendorId, setMaintenanceVendorId] = useState("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const fetchAllAssets = async (): Promise<any[]> => {
        const limit = 100
        const firstPage: any = await assetService.getAssets({ page: 1, limit })
        const total = Number(firstPage?.pagination?.total ?? firstPage?.total) || 0
        const pages = Math.max(1, Number(firstPage?.pagination?.totalPages ?? firstPage?.totalPages) || Math.ceil(total / limit) || 1)
        const remainingPages = await Promise.all(
          Array.from({ length: pages - 1 }, (_, index) => assetService.getAssets({ page: index + 2, limit })),
        )
        const allRecords = [firstPage, ...remainingPages].flatMap((response: any) =>
          Array.isArray(response) ? response : response?.data || [],
        )
        return Array.from(new Map<string, any>(allRecords.filter((asset: any) => asset?._id).map((asset: any) => [asset._id, asset])).values())
      }

      const [maintenanceResponse, projectResponse, assetResponse, vendorResponse] = await Promise.all([
        assetService.getAssetMaintenances({ limit: 500 }),
        projectService.getProjects({ limit: 500 }),
        fetchAllAssets(),
        vendorService.getVendors({ limit: 500, status: "active" }),
      ])
      const maintenanceRecords = Array.isArray(maintenanceResponse)
        ? maintenanceResponse
        : maintenanceResponse?.data || []
      const requestByAssetId = new Map<string, any>(maintenanceRecords.map((record: any) => [
        String(record.assetId?._id || record.assetId || ""), record,
      ]))
      const activeMaintenanceAssets = assetResponse
        .filter((asset: any) => asset.status === "Under Maintenance")
        .map((asset: any) => {
          const request = requestByAssetId.get(String(asset._id))
          return { ...(request || {}), assetId: asset, _id: request?._id || asset._id, status: "Under Maintenance" }
        })
      setMaintenances(activeMaintenanceAssets)
      setProjects(projectResponse.projects || [])
      setVendors(vendorResponse.vendors || [])
      setAllAssets(assetResponse)
    } catch (err: any) {
      toast.error(err.message || "Failed to load asset maintenance")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    setReturnAssetId("")
    if (!returnDialogOpen) { setAvailableAssets([]); return }
    assetService.getMaintenanceAssetsForReturn()
      .then((response) => setAvailableAssets(Array.isArray(response) ? response : response?.data || []))
      .catch((err: any) => toast.error(err.message || "Failed to load maintenance assets"))
  }, [returnDialogOpen])

  const maintenanceEligibleAssets = useMemo(() => allAssets.filter((asset) =>
    (!maintenanceProjectId || String(asset.projectId?._id || asset.projectId || "") === maintenanceProjectId) &&
    asset.status !== "Under Maintenance"
  ), [allAssets, maintenanceProjectId])

  const filteredMaintenances = useMemo(() => maintenances.filter((m) => {
    const query = searchQuery.toLowerCase()
    const asset = typeof m.assetId === "object" && m.assetId
      ? m.assetId
      : allAssets.find((item) => item._id === m.assetId)
    return (asset?.name || asset?.assetName || "").toLowerCase().includes(query) ||
      (m.vendorId?.companyName || m.vendorId?.name || "").toLowerCase().includes(query) ||
      (m.maintenanceReason || m.reason || "").toLowerCase().includes(query) || (m.notes || "").toLowerCase().includes(query)
  }), [maintenances, searchQuery, allAssets])

  const getMaintenanceAsset = (record: any) => {
    const embeddedAsset = record.assetId && typeof record.assetId === "object" ? record.assetId : null
    if (embeddedAsset?.name || embeddedAsset?.assetName) return embeddedAsset
    const assetId = embeddedAsset?._id || record.assetId
    return allAssets.find((asset) => asset._id === assetId) || embeddedAsset
  }

  const startMaintenance = async () => {
    if (!maintenanceAssetId || !maintenanceVendorId || !reason.trim() || !startDate || !endDate) {
      toast.error("Select an asset, vendor, and enter the reason and dates")
      return
    }
    setBusy(true)
    try {
      const asset = allAssets.find((item) => item._id === maintenanceAssetId)
      await assetService.createMaintenanceRequest({
        assetId: maintenanceAssetId,
        vendorId: maintenanceVendorId,
        assetType: "Asset",
        maintenanceReason: reason.trim(),
        notes,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      })
      toast.success(`${asset?.name || "Asset"} sent to maintenance`)
      setMaintenanceDialogOpen(false)
      setMaintenanceAssetId("")
      setMaintenanceVendorId("")
      setReason("")
      setNotes("")
      setStartDate("")
      setEndDate("")
      await fetchData()
    } catch (err: any) { toast.error(err.message || "Failed to create maintenance request") }
    finally { setBusy(false) }
  }

  const submitReturn = async () => {
    if (!returnProjectId || !returnAssetId) { toast.error("Select a project and asset"); return }
    setBusy(true)
    try {
      // Find matching maintenance record to supply maintenanceId and vendorId if available
      const matchingMaintenance = maintenances.find(
        (m) => String(m.assetId?._id || m.assetId || "") === returnAssetId
      )
      const maintenanceId = matchingMaintenance?._id && matchingMaintenance._id !== returnAssetId ? matchingMaintenance._id : undefined
      const vendorId = matchingMaintenance?.vendorId?._id || matchingMaintenance?.vendorId || undefined

      await assetService.createAssetReturnRequest({
        projectId: returnProjectId,
        assetId: returnAssetId,
        maintenanceId,
        vendorId,
      })
      toast.success("Return request submitted for approval")
      setReturnDialogOpen(false)
      setReturnAssetId("")
      await fetchData()
    } catch (err: any) { toast.error(err.message || "Failed to submit return request") }
    finally { setBusy(false) }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset",
      cell: ({ row }) => {
        const asset = getMaintenanceAsset(row.original)
        return (
          <div>
            <div className="font-bold">{asset?.name || asset?.assetName || (typeof row.original.assetId === "string" ? `Asset-${row.original.assetId}` : "Unknown")}</div>
            <div className="text-xs text-zinc-500">{asset?.serialNumber || asset?.type || "Asset"}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => {
        const v = row.original.vendorId
        if (!v) return <span className="text-xs text-zinc-400">-</span>
        return (
          <div className="text-sm font-medium text-zinc-800">
            {v.companyName || v.name || "-"}
            {v.vendorCode && <span className="text-xs text-zinc-500 block">({v.vendorCode})</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "maintenanceReason",
      header: "Reason",
      cell: ({ row }) => row.original.maintenanceReason || row.original.reason || row.original.description || "-",
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (row.original.startDate || row.original.fromDate) ? new Date(row.original.startDate || row.original.fromDate).toLocaleDateString() : "-",
    },
    {
      accessorKey: "endDate",
      header: "Expected End",
      cell: ({ row }) => (row.original.endDate || row.original.toDate) ? new Date(row.original.endDate || row.original.toDate).toLocaleDateString() : "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Under Maintenance</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <Button variant="outline" size="sm" onClick={() => setSelectedRecord(row.original)}><Eye className="mr-1 h-3.5 w-3.5"/>View</Button>,
    },
  ]

  return (
    <ContentLayout title="Asset Maintenance">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 rounded-lg border bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black text-zinc-950">Asset Maintenance & Returns</h1>
            <p className="mt-1 text-sm text-zinc-500">Track repairs and approve assets returning to service.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setMaintenanceDialogOpen(true)}>
              <Wrench className="mr-2 h-4 w-4"/>Send to Maintenance
            </Button>
            <Button variant="outline" onClick={() => setReturnDialogOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4"/>Request Return
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Maintenance Records</h2>
          <div className="relative w-full sm:w-64">
            <Input placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"/>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-400"/></div>
          ) : (
            <div className="p-4"><DataTable columns={columns} data={filteredMaintenances}/></div>
          )}
        </div>

        {/* SEND TO MAINTENANCE DIALOG */}
        <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Asset to Maintenance</DialogTitle>
              <DialogDescription>Select the asset and the vendor receiving the asset for maintenance.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Source Project *</Label>
                <select className="w-full rounded-md border p-2 text-sm bg-white" value={maintenanceProjectId} onChange={(e) => { setMaintenanceProjectId(e.target.value); setMaintenanceAssetId("") }}>
                  <option value="">Select project</option>
                  {projects.map((project) => <option key={project._id || project.id} value={project._id || project.id}>{project.projectName || project.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Asset *</Label>
                <select className="w-full rounded-md border p-2 text-sm bg-white" value={maintenanceAssetId} onChange={(e) => setMaintenanceAssetId(e.target.value)} disabled={!maintenanceProjectId}>
                  <option value="">Select asset</option>
                  {maintenanceEligibleAssets.map((a) => <option key={a._id} value={a._id}>{a.name || a.assetName || `Asset-${a._id}`}{a.serialNumber ? ` · ${a.serialNumber}` : ""}{a.status === "Returned" ? " · Returned" : ""}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Maintenance Vendor *</Label>
                <select className="w-full rounded-md border p-2 text-sm bg-white" value={maintenanceVendorId} onChange={(e) => setMaintenanceVendorId(e.target.value)}>
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v._id || v.id} value={v._id || v.id}>
                      {v.companyName || v.name} {v.vendorCode ? `(${v.vendorCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reason *</Label>
                <Input placeholder="Maintenance reason" value={reason} onChange={(e) => setReason(e.target.value)}/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Start Date *</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Expected End Date *</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Notes (Optional)</Label>
                <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}/>
              </div>

              <Button className="w-full font-bold" disabled={busy || !maintenanceAssetId || !maintenanceVendorId || !reason || !startDate || !endDate} onClick={startMaintenance}>
                {busy ? "Submitting..." : "Start Maintenance"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* REQUEST RETURN DIALOG */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Asset Return</DialogTitle>
              <DialogDescription>Choose the destination project, then select any asset under maintenance. Approval moves it into that project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Destination Project *</Label>
                <select className="w-full rounded-md border p-2 text-sm bg-white" value={returnProjectId} onChange={(e) => { setReturnProjectId(e.target.value); setReturnAssetId("") }}>
                  <option value="">Select destination project</option>
                  {projects.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.projectName || p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Maintenance Asset *</Label>
                <select className="w-full rounded-md border p-2 text-sm bg-white" value={returnAssetId} onChange={(e) => setReturnAssetId(e.target.value)} disabled={!returnProjectId}>
                  <option value="">Select maintenance asset</option>
                  {availableAssets.map((a) => {
                    const sourceProjectId = String(a.projectId?._id || a.projectId || "")
                    const sourceProject = projects.find((project) => String(project._id || project.id || "") === sourceProjectId)
                    return <option key={a._id} value={a._id}>{a.name}{a.serialNumber ? ` · ${a.serialNumber}` : ""}{sourceProject ? ` · From ${sourceProject.projectName || sourceProject.name}` : ""}</option>
                  })}
                </select>
              </div>

              {returnProjectId && availableAssets.length === 0 && <p className="text-sm text-zinc-500">No assets under maintenance are available for return.</p>}

              <Button className="w-full font-bold" disabled={busy || !returnAssetId} onClick={submitReturn}>
                {busy ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DETAILS DIALOG */}
        <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Maintenance Details</DialogTitle>
              <DialogDescription>Maintenance record details</DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-2 text-sm">
                <p><b>Asset:</b> {getMaintenanceAsset(selectedRecord)?.name || getMaintenanceAsset(selectedRecord)?.assetName || (typeof selectedRecord.assetId === "string" ? `Asset-${selectedRecord.assetId}` : "Unknown")}</p>
                {selectedRecord.vendorId && (
                  <p><b>Vendor:</b> {selectedRecord.vendorId?.companyName || selectedRecord.vendorId?.name || "-"}</p>
                )}
                <p><b>Reason:</b> {selectedRecord.maintenanceReason || selectedRecord.reason || selectedRecord.description || "-"}</p>
                <p><b>Status:</b> Under Maintenance</p>
                <p><b>Period:</b> {(selectedRecord.startDate || selectedRecord.fromDate) ? new Date(selectedRecord.startDate || selectedRecord.fromDate).toLocaleDateString() : "-"} to {(selectedRecord.endDate || selectedRecord.toDate) ? new Date(selectedRecord.endDate || selectedRecord.toDate).toLocaleDateString() : "-"}</p>
                <p><b>Notes:</b> {selectedRecord.notes || "-"}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}
