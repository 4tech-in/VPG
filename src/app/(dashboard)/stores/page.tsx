"use client"

import { useState, useEffect } from "react"
import { 
  Building2, 
  MapPin, 
  User, 
  BarChart3, 
  Box, 
  AlertCircle, 
  MoreVertical, 
  Search, 
  Plus,
  Warehouse,
  Package,
  Activity,
  ArrowUpRight,
  Store,
  Printer,
  Filter,
  FileSpreadsheet,
  X,
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { assetService } from "@/service/assets.api"
import { projectService, type ApiProject } from "@/service/projectService"

export default function StoresPage() {
  const [data, setData] = useState<any[]>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [projects, setProjects] = useState<ApiProject[]>([])
  
  // Filters state
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [newProjectId, setNewProjectId] = useState("")
  
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  const activeFilterCount = [
    selectedProjectId,
    selectedType,
    selectedStatus,
    dateFrom,
    dateTo
  ].filter(Boolean).length
  
  // Transfer requests state
  const [transferRequests, setTransferRequests] = useState<any[]>([])
  const [returnDatesByAssetId, setReturnDatesByAssetId] = useState<Record<string, string>>({})
  const [transferLoading, setTransferLoading] = useState(false)
  const [activeRequestTab, setActiveRequestTab] = useState("all")

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any | null>(null)

  // Form states for creation
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("Equipment")
  const [newSerialNumber, setNewSerialNumber] = useState("")
  const [newIssuedDate, setNewIssuedDate] = useState("")
  const [newStatus, setNewStatus] = useState("Issued")
  const [newMaintenanceDate, setNewMaintenanceDate] = useState("")
  const [newExtraNote, setNewExtraNote] = useState("")

  // Form states for editing
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("")
  const [editSerialNumber, setEditSerialNumber] = useState("")
  const [editIssuedDate, setEditIssuedDate] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editMaintenanceDate, setEditMaintenanceDate] = useState("")
  const [editExtraNote, setEditExtraNote] = useState("")

  const fetchAssets = async (
    searchStr = searchTerm,
    p = page,
    l = limit,
    projectId = selectedProjectId,
    status = selectedStatus,
    type = selectedType,
    dFrom = dateFrom,
    dTo = dateTo
  ) => {
    try {
      setLoading(true)
      const res = await assetService.getAssets({
        search: searchStr,
        page: p,
        limit: l,
        projectId: projectId || undefined,
        status: status || undefined,
        type: type || undefined,
        dateFrom: dFrom || undefined,
        dateTo: dTo || undefined,
      })
      if (Array.isArray(res)) {
        setData(res)
      } else if (res && res.data) {
        setData(res.data)
        if (res.pagination) {
          setPagination({
            total: res.pagination.total || res.data.length,
            totalPages: res.pagination.totalPages || 1
          })
        }
      } else {
        setData([])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch assets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    projectService.getProjects({ limit: 500 })
      .then((response) => setProjects(response.projects || []))
      .catch((err: any) => toast.error(err.message || "Failed to load projects"))
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1)
      fetchAssets(searchTerm, 1, limit, selectedProjectId, selectedStatus, selectedType, dateFrom, dateTo)
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  useEffect(() => {
    fetchAssets(searchTerm, page, limit, selectedProjectId, selectedStatus, selectedType, dateFrom, dateTo)
  }, [page, limit, selectedProjectId, selectedStatus, selectedType, dateFrom, dateTo])

  const handleClearFilters = () => {
    setSelectedProjectId("")
    setSelectedType("")
    setSelectedStatus("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const handlePrintAssets = async () => {
    try {
      setIsPrinting(true)
      let printData = data

      if (pagination.total > data.length) {
        toast.info("Preparing complete asset register for print...")
        const res = await assetService.getAssets({
          search: searchTerm || undefined,
          page: 1,
          limit: Math.max(pagination.total, 500),
          projectId: selectedProjectId || undefined,
          status: selectedStatus || undefined,
          type: selectedType || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        if (res && res.data && Array.isArray(res.data)) {
          printData = res.data
        }
      }

      if (!printData || printData.length === 0) {
        toast.error("No assets available to print.")
        return
      }

      const printWindow = window.open("", "_blank", "width=1200,height=800")
      if (!printWindow) {
        toast.error("Please allow popups to print asset report.")
        return
      }

      const tableRowsHtml = printData.map((asset, index) => {
        const pId = asset.projectId?._id || asset.projectId
        const projectObj = projects.find((p) => String(p._id || p.id) === String(pId))
        const projectName = projectObj?.projectName || "—"
        const issuedDateStr = asset.issuedDate 
          ? new Date(asset.issuedDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }) 
          : "—"
        const returnDateVal = asset.returnDate || asset.returnedAt || asset.lastReturnDate || returnDatesByAssetId[String(asset._id)]
        const returnDateStr = returnDateVal
          ? new Date(returnDateVal).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" })
          : "—"

        return `
          <tr>
            <td style="text-align: center; font-weight: bold;">${index + 1}</td>
            <td style="font-weight: 700;">${asset.name || "—"}</td>
            <td style="text-align: center;">${asset.type || "—"}</td>
            <td style="font-family: monospace; font-weight: 600; text-align: center;">${asset.serialNumber || "—"}</td>
            <td>${projectName}</td>
            <td style="text-align: center; white-space: nowrap;">${issuedDateStr}</td>
            <td style="text-align: center;">
              <span class="status-badge status-${(asset.status || "Issued").toLowerCase().replace(/\\s+/g, '-')}">
                ${asset.status || "Issued"}
              </span>
            </td>
            <td style="text-align: center; white-space: nowrap;">${returnDateStr}</td>
            <td>${asset.extraNote || "—"}</td>
          </tr>
        `
      }).join("")

      const filterSummaries = []
      if (selectedProjectId) {
        const p = projects.find(pr => String(pr._id || pr.id) === String(selectedProjectId))
        if (p) filterSummaries.push(`Project: ${p.projectName}`)
      }
      if (selectedType) filterSummaries.push(`Type: ${selectedType}`)
      if (selectedStatus) filterSummaries.push(`Status: ${selectedStatus}`)
      if (dateFrom) filterSummaries.push(`From: ${dateFrom}`)
      if (dateTo) filterSummaries.push(`To: ${dateTo}`)
      if (searchTerm) filterSummaries.push(`Search: "${searchTerm}"`)
      const filterMeta = filterSummaries.length > 0 ? filterSummaries.join(" | ") : "All Assets"

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Asset Inventory Register - VPG Construction</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 12mm 10mm;
              }
              * {
                box-sizing: border-box;
              }
              body {
                font-family: Arial, -apple-system, BlinkMacSystemFont, sans-serif;
                color: #111827;
                background: #ffffff;
                margin: 0;
                padding: 0;
                font-size: 11px;
                line-height: 1.4;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header-box {
                text-align: center;
                margin-bottom: 14px;
                border-bottom: 2px solid #18181b;
                padding-bottom: 10px;
              }
              .company-name {
                font-size: 18px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 4px;
                color: #09090b;
              }
              .register-title {
                font-size: 14px;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #18181b;
                margin-bottom: 4px;
              }
              .filter-subtitle {
                font-size: 10px;
                color: #52525b;
                font-weight: 600;
                margin-bottom: 6px;
              }
              .meta-bar {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                font-weight: 700;
                margin-top: 6px;
                color: #52525b;
                border-top: 1px dashed #d4d4d8;
                padding-top: 4px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
              }
              th {
                background-color: #f4f4f5;
                color: #09090b;
                border: 1px solid #71717a;
                padding: 7px 6px;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                text-align: center;
                letter-spacing: 0.03em;
              }
              td {
                border: 1px solid #a1a1aa;
                padding: 6px 7px;
                font-size: 10px;
                vertical-align: middle;
              }
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              tr:nth-child(even) td {
                background-color: #fafafa;
              }
              .status-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                border: 1px solid #e4e4e7;
              }
              .status-issued {
                background-color: #eff6ff;
                color: #1d4ed8;
                border-color: #bfdbfe;
              }
              .status-under-maintenance {
                background-color: #fffbeb;
                color: #b45309;
                border-color: #fde68a;
              }
              .status-returned {
                background-color: #ecfdf5;
                color: #047857;
                border-color: #a7f3d0;
              }
              .footer-box {
                margin-top: 36px;
                display: flex;
                justify-content: space-around;
                padding-top: 12px;
                border-top: 1px solid #e4e4e7;
                font-size: 10px;
                color: #71717a;
              }
              .sig-block {
                text-align: center;
                min-width: 150px;
                padding-top: 30px;
                border-top: 1px solid #000;
                font-weight: 700;
                color: #000;
              }
            </style>
          </head>
          <body>
            <div class="header-box">
              <div class="company-name">VPG Construction Private Limited</div>
              <div class="register-title">Asset Inventory Register</div>
              <div class="filter-subtitle">${filterMeta}</div>
              <div class="meta-bar">
                <span>Date Generated: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>Total Assets: ${printData.length}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 45px;">Sr. No</th>
                  <th>Asset Name</th>
                  <th style="width: 110px;">Type</th>
                  <th style="width: 130px;">Serial Number</th>
                  <th>Project</th>
                  <th style="width: 90px;">Issued Date</th>
                  <th style="width: 120px;">Status</th>
                  <th style="width: 90px;">Return Date</th>
                  <th>Remarks / Note</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No assets found matching the criteria.</td></tr>'}
              </tbody>
            </table>

            <div class="footer-box">
              <div class="sig-block">Prepared By</div>
              <div class="sig-block">Store In-Charge</div>
              <div class="sig-block">Authorized Signatory</div>
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `

      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    } catch (err: any) {
      toast.error(err.message || "Failed to print assets")
    } finally {
      setIsPrinting(false)
    }
  }

  const handlePrintSingleAsset = (asset: any) => {
    const printWindow = window.open("", "_blank", "width=850,height=900")
    if (!printWindow) {
      toast.error("Please allow popups to print asset details.")
      return
    }

    const pId = asset.projectId?._id || asset.projectId
    const projectObj = projects.find((p) => String(p._id || p.id) === String(pId))
    const projectName = projectObj?.projectName || "—"
    const issuedDateStr = asset.issuedDate 
      ? new Date(asset.issuedDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric" }) 
      : "—"
    const returnDateVal = asset.returnDate || asset.returnedAt || asset.lastReturnDate || returnDatesByAssetId[String(asset._id)]
    const returnDateStr = returnDateVal
      ? new Date(returnDateVal).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric" })
      : "—"
    const maintenanceDateStr = asset.maintenanceDueDate
      ? new Date(asset.maintenanceDueDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric" })
      : "—"

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Slip - ${asset.name || "Asset"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 12mm;
            }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, sans-serif;
              color: #000;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.45;
            }
            .slip {
              border: 1px solid #000;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .company {
              font-size: 18px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .title {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin-top: 4px;
            }
            .meta {
              font-size: 10px;
              color: #444;
              margin-top: 4px;
            }
            table.details {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            table.details th,
            table.details td {
              border: 1px solid #000;
              padding: 8px 10px;
              text-align: left;
              vertical-align: top;
            }
            table.details th {
              width: 18%;
              background: #f3f4f6;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #111;
            }
            table.details td {
              width: 32%;
              font-size: 12px;
              font-weight: 500;
            }
            .signatures {
              margin-top: 56px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 24px;
              text-align: center;
            }
            .sig-line {
              border-top: 1px solid #000;
              padding-top: 6px;
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="slip">
            <div class="header">
              <div class="company">VPG Construction Private Limited</div>
              <div class="title">Asset Allocation Slip</div>
              <div class="meta">Generated: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <table class="details">
              <tbody>
                <tr>
                  <th>Asset Name</th>
                  <td><strong>${asset.name || "—"}</strong></td>
                  <th>Type / Category</th>
                  <td>${asset.type || "—"}</td>
                </tr>
                <tr>
                  <th>Serial Number</th>
                  <td>${asset.serialNumber || "—"}</td>
                  <th>Project</th>
                  <td>${projectName}</td>
                </tr>
                <tr>
                  <th>Issued Date</th>
                  <td>${issuedDateStr}</td>
                  <th>Status</th>
                  <td>${asset.status || "Issued"}</td>
                </tr>
                <tr>
                  <th>Maintenance Due</th>
                  <td>${maintenanceDateStr}</td>
                  <th>Return Date</th>
                  <td>${returnDateStr}</td>
                </tr>
                <tr>
                  <th>Remarks</th>
                  <td colspan="3">${asset.extraNote || "—"}</td>
                </tr>
              </tbody>
            </table>

            <div class="signatures">
              <div>
                <div style="height: 36px;"></div>
                <div class="sig-line">Prepared By</div>
              </div>
              <div>
                <div style="height: 36px;"></div>
                <div class="sig-line">Site Store In-Charge</div>
              </div>
              <div>
                <div style="height: 36px;"></div>
                <div class="sig-line">Receiver / Operator</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const fetchTransferRequests = async () => {
    try {
      setTransferLoading(true)
      const [transferResponse, returnResponse] = await Promise.all([
        assetService.getAssetTransfers(),
        assetService.getAssetReturnRequests(),
      ])
      const asList = (response: any): any[] => Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
      const transfers = asList(transferResponse).map((request) => ({
        ...request,
        requestType: "transfer",
        requestId: request._id || request.id,
        _id: `transfer-${request._id || request.id}`,
      }))
      const returns = asList(returnResponse).map((request) => ({
        ...request,
        requestType: "return",
        requestId: request._id || request.id,
        _id: `return-${request._id || request.id}`,
      }))
      const returnDates = asList(returnResponse).reduce((dates: Record<string, string>, request: any) => {
        if (request.status !== "Approved") return dates
        const assetId = String(request.assetId?._id || request.assetId || "")
        const date = request.returnDate || request.returnedAt || request.approvedAt || request.updatedAt
        if (!assetId || !date) return dates
        const currentDate = dates[assetId]
        if (!currentDate || new Date(date).getTime() > new Date(currentDate).getTime()) dates[assetId] = date
        return dates
      }, {})
      setReturnDatesByAssetId(returnDates)
      setTransferRequests([...transfers, ...returns].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ))
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch transfer requests")
    } finally {
      setTransferLoading(false)
    }
  }

  useEffect(() => {
    fetchTransferRequests()
  }, [])

  const handleApproveTransfer = async (request: any) => {
    try {
      if (request.requestType === "return") await assetService.approveAssetReturnRequest(request.requestId)
      else await assetService.approveAssetTransfer(request.requestId)
      toast.success(request.requestType === "return" ? "Asset return approved" : "Transfer request approved")
      fetchTransferRequests()
    } catch (err: any) {
      toast.error(err.message || "Failed to approve transfer")
    }
  }

  const handleRejectTransfer = async (request: any) => {
    const reason = window.prompt(request.requestType === "return" ? "Enter return rejection reason:" : "Enter rejection reason:")
    if (!reason || !reason.trim()) return
    try {
      if (request.requestType === "return") await assetService.rejectAssetReturnRequest(request.requestId, reason.trim())
      else await assetService.rejectAssetTransfer(request.requestId, reason.trim())
      toast.success(request.requestType === "return" ? "Asset return rejected" : "Transfer request rejected")
      fetchTransferRequests()
    } catch (err: any) {
      toast.error(err.message || "Failed to reject transfer")
    }
  }

  useEffect(() => {
    if (editingAsset) {
      setEditName(editingAsset.name || "")
      setEditType(editingAsset.type || "")
      setEditSerialNumber(editingAsset.serialNumber || "")
      setEditIssuedDate(editingAsset.issuedDate ? new Date(editingAsset.issuedDate).toISOString().split("T")[0] : "")
      setEditStatus(editingAsset.status || "")
      setEditMaintenanceDate(editingAsset.maintenanceDueDate ? new Date(editingAsset.maintenanceDueDate).toISOString().split("T")[0] : "")
      setEditExtraNote(editingAsset.extraNote || "")
    }
  }, [editingAsset])

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newType.trim() || !newProjectId) {
      toast.error("Project, asset name, and type are required")
      return
    }

    try {
      await assetService.createAsset({
        name: newName,
        type: newType,
        projectId: newProjectId,
        serialNumber: newSerialNumber.trim() || undefined,
        issuedDate: newIssuedDate || undefined,
        status: newStatus,
        maintenanceDueDate: newMaintenanceDate || undefined,
        extraNote: newExtraNote
      })
      toast.success("New asset added successfully")
      setSelectedProjectId(newProjectId)
      setPage(1)
      setIsDialogOpen(false)
      // Reset form
      setNewName("")
      setNewProjectId("")
      setNewType("Equipment")
      setNewSerialNumber("")
      setNewIssuedDate("")
      setNewStatus("Issued")
      setNewMaintenanceDate("")
      setNewExtraNote("")
      await fetchAssets(searchTerm, 1, limit, newProjectId)
    } catch (err: any) {
      toast.error(err.message || "Failed to create asset")
    }
  }

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAsset) return

    try {
      await assetService.updateAsset(editingAsset._id, {
        name: editName,
        type: editType,
        serialNumber: editSerialNumber.trim() || undefined,
        issuedDate: editIssuedDate || undefined,
        status: editStatus,
        maintenanceDueDate: editMaintenanceDate || undefined,
        extraNote: editExtraNote
      })
      toast.success("Asset updated successfully")
      setIsEditDialogOpen(false)
      setEditingAsset(null)
      fetchAssets(searchTerm)
    } catch (err: any) {
      toast.error(err.message || "Failed to update asset")
    }
  }

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])
  }

  const toggleCurrentPageSelection = () => {
    const pageIds = data.map((asset) => asset._id).filter(Boolean)
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedAssetIds.includes(id))
    setSelectedAssetIds((current) => allSelected
      ? current.filter((id) => !pageIds.includes(id))
      : [...new Set([...current, ...pageIds])])
  }

  const handleBulkDeleteAssets = async () => {
    if (selectedAssetIds.length === 0) return
    if (!confirm(`Delete ${selectedAssetIds.length} selected asset${selectedAssetIds.length === 1 ? "" : "s"}? This cannot be undone.`)) return
    setIsBulkDeleting(true)
    try {
      const response = await assetService.deleteMultipleAssets(selectedAssetIds)
      const deletedCount = response?.deletedCount ?? selectedAssetIds.length
      toast.success(`${deletedCount} asset${deletedCount === 1 ? "" : "s"} deleted successfully`)
      setSelectedAssetIds([])
      await fetchAssets(searchTerm, page, limit)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected assets")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await assetService.deleteAsset(id)
      toast.success("Asset deleted successfully")
      fetchAssets(searchTerm)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset")
    }
  }

  const currentPageIds = data.map((asset) => asset._id).filter(Boolean)
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedAssetIds.includes(id))

  const columns: ColumnDef<any>[] = [
    {
      id: "selection",
      header: () => <input aria-label="Select all assets on this page" type="checkbox" checked={allCurrentPageSelected} onChange={toggleCurrentPageSelection} className="h-4 w-4 accent-primary" />,
      cell: ({ row }) => <input aria-label={`Select ${row.original.name}`} type="checkbox" checked={selectedAssetIds.includes(row.original._id)} onChange={() => toggleAssetSelection(row.original._id)} className="h-4 w-4 accent-primary" />,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Asset Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 text-sm tracking-tight">{row.getValue("name")}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-1">Type: {row.original.type}</span>
          </div>
        </div>
      ),
    },
    {
      id: "project",
      header: "Project",
      cell: ({ row }) => {
        const pId = row.original.projectId?._id || row.original.projectId
        const projectObj = projects.find((p) => String(p._id || p.id) === String(pId))
        return (
          <span className="text-zinc-700 font-semibold text-xs">
            {projectObj?.projectName || "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "serialNumber",
      header: "Serial Number",
      cell: ({ row }) => (
        <span className="text-zinc-600 font-medium text-xs">{row.getValue("serialNumber") || "—"}</span>
      ),
    },
    {
      accessorKey: "issuedDate",
      header: "Issued Date",
      cell: ({ row }) => {
        const val = row.getValue("issuedDate")
        return (
          <span className="text-zinc-600 font-medium text-xs">
            {val ? new Date(val as string).toLocaleDateString("en-IN") : "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-lg px-3 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider",
            status === "Returned" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
            status === "Under Maintenance" ? "bg-amber-50 text-amber-600 border-amber-100" :
            "bg-blue-50 text-blue-600 border-blue-100"
          )}>
            {status || "Issued"}
          </Badge>
        )
      },
    },
    {
      id: "returnDate",
      header: "Return Date",
      cell: ({ row }) => {
        const value = row.original.returnDate || row.original.returnedAt || row.original.lastReturnDate || returnDatesByAssetId[String(row.original._id)]
        return <span className="text-zinc-600 font-medium text-xs">{value ? new Date(value).toLocaleDateString("en-IN") : "—"}</span>
      },
    },
    {
      id: "actions",
      header: () => <div className="w-full text-center">Operations</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePrintSingleAsset(row.original)}
            className="h-9 px-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-bold text-[11px] gap-1.5 transition-all"
            title="Print Asset Slip"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingAsset(row.original)
              setIsEditDialogOpen(true)
            }}
            className="h-9 px-3 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-bold text-[11px] gap-2 transition-all"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this asset?")) {
                handleDeleteAsset(row.original._id)
              }
            }}
            className="h-9 px-3 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-[11px] gap-2 transition-all"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const transferColumns: ColumnDef<any>[] = [
    {
      accessorKey: "assetId.name",
      header: "Asset",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900">{row.original.assetId?.name || row.original.assetId?.assetName || "Unknown Asset"}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">SN: {row.original.assetId?.serialNumber || "N/A"}</span>
        </div>
      ),
    },
    {
      accessorKey: "sourceProjectId.projectName",
      header: "From Project",
      cell: ({ row }) => (
        <span className="text-zinc-600 font-medium text-xs">{row.original.requestType === "return" ? row.original.assetId?.projectId?.projectName || row.original.assetId?.projectId?.name || "—" : row.original.sourceProjectId?.projectName || row.original.sourceProjectId?.name || "—"}</span>
      ),
    },
    {
      accessorKey: "destinationProjectId.projectName",
      header: "To Project",
      cell: ({ row }) => (
        <span className="text-zinc-600 font-medium text-xs">{row.original.requestType === "return" ? row.original.projectId?.projectName || row.original.projectId?.name || "—" : row.original.destinationProjectId?.projectName || row.original.destinationProjectId?.name || "—"}</span>
      ),
    },
    {
      accessorKey: "requestedBy.name",
      header: "Requested By",
      cell: ({ row }) => (
        <span className="text-zinc-600 font-medium text-xs">{row.original.requestedBy?.name || "System"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as string
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge className={cn(
              "rounded-lg px-3 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider",
              status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              status === "Rejected" ? "bg-rose-50 text-rose-600 border-rose-100" :
              "bg-amber-50 text-amber-600 border-amber-100"
            )}>
              {status}
            </Badge>
            {status === "Rejected" && row.original.rejectionReason && (
              <span className="text-[9px] text-zinc-500 font-medium max-w-[150px] truncate" title={row.original.rejectionReason}>
                {row.original.rejectionReason}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const status = row.original.status
        if (status !== "Pending") return <div className="text-center text-zinc-300 font-medium text-xs">—</div>
        return (
          <div className="flex justify-center gap-2">
          <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApproveTransfer(row.original)}
              className="h-8 px-3 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-wider transition-all border border-emerald-100 bg-emerald-50/50"
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRejectTransfer(row.original)}
              className="h-8 px-3 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider transition-all border border-rose-100 bg-rose-50/50"
            >
              Reject
            </Button>
          </div>
        )
      }
    }
  ]

  const filteredRequests = transferRequests.filter(req => {
    if (activeRequestTab === "all") return true
    if (activeRequestTab === "pending") return req.status === "Pending"
    if (activeRequestTab === "approved") return req.status === "Approved"
    return true
  })

  return (
    <ContentLayout title="Asset Management">
      <div className="flex flex-col gap-10 p-6 sm:p-12 max-w-[1700px] mx-auto min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
           <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Asset Management</h1>
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Network Asset Inventory</p>
              </div>
           </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-8 h-14 bg-white border border-zinc-100 rounded-2xl p-1.5 shadow-sm inline-flex">
            <TabsTrigger value="list" className="h-11 px-8 rounded-xl font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all">All Assets List</TabsTrigger>
            <TabsTrigger value="requests" className="h-11 px-8 rounded-xl font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all">Asset Return Request</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                 <Input 
                   placeholder="Search assets by name, serial no, note..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="h-11 rounded-xl bg-white border-zinc-200/80 pl-10 font-medium text-sm shadow-xs focus:ring-primary" 
                 />
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={handlePrintAssets}
                  disabled={isPrinting}
                  className="h-11 rounded-xl px-4 font-bold shadow-xs bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-2 text-xs"
                >
                  <Printer className="h-4 w-4" />
                  {isPrinting ? "Preparing..." : "Print Register"}
                </Button>

                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "h-11 rounded-xl px-4 gap-2 font-bold text-xs shadow-xs transition-all",
                    showFilters 
                      ? "bg-primary text-primary-foreground shadow-primary/20" 
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-0.5 px-1.5 py-0.5 text-[10px] font-black bg-zinc-100 text-zinc-900 rounded-md">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {selectedAssetIds.length > 0 && (
                  <Button 
                    variant="destructive" 
                    className="h-11 rounded-xl px-4 font-bold text-xs" 
                    disabled={isBulkDeleting} 
                    onClick={handleBulkDeleteAssets}
                  >
                    {isBulkDeleting ? "Deleting..." : `Delete ${selectedAssetIds.length} Selected`}
                  </Button>
                )}

                {/* Create Asset Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-11 rounded-xl px-5 font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground flex items-center gap-2 transition-all active:scale-95 duration-300 text-xs">
                       <Plus className="h-4 w-4" />
                       Add Asset
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
                  <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Store className="h-32 w-32" />
                    </div>
                    <div className="flex items-center gap-4 relative">
                       <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Store className="h-6 w-6" />
                       </div>
                       <div className="flex flex-col gap-1">
                          <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">Register New Asset</DialogTitle>
                          <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                            Add a new asset to the system inventory
                          </DialogDescription>
                       </div>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleAddStore} className="p-8 bg-zinc-50/30 space-y-6 overflow-y-auto">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Project</Label>
                      <Select value={newProjectId} onValueChange={setNewProjectId}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm"><SelectValue placeholder="Select project" /></SelectTrigger>
                        <SelectContent>{projects.map((project) => <SelectItem key={project._id || project.id} value={String(project._id || project.id)}>{project.projectName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Name</Label>
                        <Input 
                          placeholder="e.g. Concrete Mixer" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Type</Label>
                        <Select value={newType} onValueChange={setNewType}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Tool">Tool</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serial Number (Optional)</Label>
                        <Input 
                          placeholder="e.g. SN-982173" 
                          value={newSerialNumber}
                          onChange={(e) => setNewSerialNumber(e.target.value)}
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Issued Date</Label>
                        <Input 
                          type="date"
                          value={newIssuedDate}
                          onChange={(e) => setNewIssuedDate(e.target.value)}
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Initial Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                            <SelectItem value="Issued">Issued</SelectItem>
                            <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                            <SelectItem value="Returned">Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance Due</Label>
                        <Input 
                          type="date" 
                          value={newMaintenanceDate}
                          onChange={(e) => setNewMaintenanceDate(e.target.value)}
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Extra Note</Label>
                      <Textarea 
                        placeholder="Add any specific storage, operator or location remarks..."
                        value={newExtraNote}
                        onChange={(e) => setNewExtraNote(e.target.value)}
                        className="min-h-[100px] rounded-2xl bg-white border-zinc-100 font-bold text-sm p-4 focus:ring-primary shadow-sm resize-none"
                      />
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</Button>
                      <Button type="submit" className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Register Asset</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Project</Label>
                  <Select 
                    value={selectedProjectId || "all"} 
                    onValueChange={(value) => { 
                      setSelectedProjectId(value === "all" ? "" : value)
                      setPage(1)
                      setSelectedAssetIds([]) 
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-zinc-200/70 font-semibold text-xs">
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl bg-white max-h-72">
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project._id || project.id} value={String(project._id || project.id)}>
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Type</Label>
                  <Select 
                    value={selectedType || "all"} 
                    onValueChange={(value) => { 
                      setSelectedType(value === "all" ? "" : value)
                      setPage(1) 
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-zinc-200/70 font-semibold text-xs">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl bg-white">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Vehicle">Vehicle</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Tool">Tool</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</Label>
                  <Select 
                    value={selectedStatus || "all"} 
                    onValueChange={(value) => { 
                      setSelectedStatus(value === "all" ? "" : value)
                      setPage(1) 
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-zinc-200/70 font-semibold text-xs">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl bg-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Issued">Issued</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date From</Label>
                  <Input 
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="h-11 rounded-xl bg-zinc-50 border-zinc-200/70 font-semibold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date To</Label>
                  <Input 
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="h-11 rounded-xl bg-zinc-50 border-zinc-200/70 font-semibold text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    disabled={activeFilterCount === 0}
                    className="h-11 w-full rounded-xl font-bold text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            
            {/* Ledger Card */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">
                Loading Assets...
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={data} 
                isServerSide={true}
                pageIndex={page - 1}
                pageSize={limit}
                pageCount={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={(idx) => setPage(idx + 1)}
                onPageSizeChange={(size) => {
                  setLimit(size)
                  setPage(1)
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="outline-none space-y-6">
            <Tabs value={activeRequestTab} onValueChange={setActiveRequestTab} className="w-full">
              <TabsList className="mb-2 h-12 bg-zinc-100/50 border border-zinc-100 rounded-xl p-1 inline-flex shadow-inner">
                <TabsTrigger value="all" className="h-10 px-8 rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm transition-all">All</TabsTrigger>
                <TabsTrigger value="pending" className="h-10 px-8 rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all">Pending</TabsTrigger>
                <TabsTrigger value="approved" className="h-10 px-8 rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">Approved</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="outline-none mt-4">
                {transferLoading ? (
                  <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center border border-zinc-100 shadow-sm flex flex-col items-center justify-center">
                    <Package className="h-16 w-16 text-zinc-200 mb-6" />
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">All Requests</h2>
                    <p className="text-zinc-500 font-medium max-w-sm text-sm">
                      No asset requests found.
                    </p>
                  </div>
                ) : (
                  <DataTable columns={transferColumns} data={filteredRequests} />
                )}
              </TabsContent>

              <TabsContent value="pending" className="outline-none mt-4">
                {transferLoading ? (
                  <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center border border-zinc-100 shadow-sm flex flex-col items-center justify-center">
                    <Package className="h-16 w-16 text-amber-200/50 mb-6" />
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Pending Requests</h2>
                    <p className="text-zinc-500 font-medium max-w-sm text-sm">
                      No pending asset requests require your approval at the moment.
                    </p>
                  </div>
                ) : (
                  <DataTable columns={transferColumns} data={filteredRequests} />
                )}
              </TabsContent>

              <TabsContent value="approved" className="outline-none mt-4">
                {transferLoading ? (
                  <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center border border-zinc-100 shadow-sm flex flex-col items-center justify-center">
                    <Package className="h-16 w-16 text-emerald-200/50 mb-6" />
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Approved Requests</h2>
                    <p className="text-zinc-500 font-medium max-w-sm text-sm">
                      No approved asset requests found in the history.
                    </p>
                  </div>
                ) : (
                  <DataTable columns={transferColumns} data={filteredRequests} />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>


        {/* Edit Asset Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Store className="h-32 w-32" />
               </div>
               <div className="flex items-center gap-4 relative">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                     <Store className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                     <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">Edit Asset</DialogTitle>
                     <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                       Update Asset Specifications
                     </DialogDescription>
                  </div>
               </div>
            </DialogHeader>
            <form onSubmit={handleUpdateAsset} className="p-8 bg-zinc-50/30 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Name</Label>
                  <Input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Type</Label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                      <SelectItem value="Vehicle">Vehicle</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Tool">Tool</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serial Number (Optional)</Label>
                  <Input 
                    value={editSerialNumber}
                    onChange={(e) => setEditSerialNumber(e.target.value)}
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Issued Date</Label>
                  <Input 
                    type="date"
                    value={editIssuedDate}
                    onChange={(e) => setEditIssuedDate(e.target.value)}
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                      <SelectItem value="Issued">Issued</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance Due</Label>
                  <Input 
                    type="date"
                    value={editMaintenanceDate}
                    onChange={(e) => setEditMaintenanceDate(e.target.value)}
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Extra Note</Label>
                <Textarea 
                  value={editExtraNote}
                  onChange={(e) => setEditExtraNote(e.target.value)}
                  className="min-h-[100px] rounded-2xl bg-white border-zinc-100 font-bold text-sm p-4 focus:ring-primary shadow-sm resize-none"
                />
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</Button>
                <Button type="submit" className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Update Asset</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </ContentLayout>
  )
}
