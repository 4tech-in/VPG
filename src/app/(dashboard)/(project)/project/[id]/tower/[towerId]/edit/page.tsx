"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContentLayout } from "@/components/admin-panel/content-layout"

export default function EditTowerPage({ 
  params 
}: { 
  params: { id: string; towerId: string } 
}) {
  // In a real app, you'd fetch this data based on the IDs
  const tower = {
    id: params.towerId,
    name: "Tower A",
    number: "A-101",
    status: "Active",
    projectName: "ABC Residency"
  }

  return (
    <ContentLayout title="Edit Tower">
      <div className="flex flex-col gap-6 p-4 sm:p-8 bg-zinc-50/50 min-h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/project/${params.id}/tower/${params.towerId}`}>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-zinc-200">
              <ArrowLeft className="h-5 w-5 text-zinc-600" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Edit Tower</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-12 shadow-sm space-y-8">
          <h2 className="text-xl font-black text-zinc-900 mb-8">Tower Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Select */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-600">Project</label>
              <Select defaultValue={tower.projectName}>
                <SelectTrigger className="h-14 rounded-2xl border-zinc-200 bg-white text-zinc-900 font-bold px-6">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200">
                  <SelectItem value="ABC Residency" className="font-bold">ABC Residency</SelectItem>
                  <SelectItem value="Marbella Grande" className="font-bold">Marbella Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tower Name */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-600">Tower Name</label>
              <Input 
                defaultValue={tower.name}
                placeholder="Tower A"
                className="h-14 rounded-2xl border-zinc-200 bg-white text-zinc-900 font-bold px-6 focus-visible:ring-primary/20"
              />
            </div>

            {/* Tower Number */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-600">Tower Number</label>
              <Input 
                defaultValue={tower.number}
                placeholder="A-101"
                className="h-14 rounded-2xl border-zinc-200 bg-white text-zinc-900 font-bold px-6 focus-visible:ring-primary/20"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-600">Status</label>
              <Select defaultValue={tower.status}>
                <SelectTrigger className="h-14 rounded-2xl border-zinc-200 bg-white text-zinc-900 font-bold px-6">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200">
                  <SelectItem value="Active" className="font-bold">Active</SelectItem>
                  <SelectItem value="Inactive" className="font-bold">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-8 border-t border-zinc-100">
            <Link href={`/project/${params.id}/tower/${params.towerId}`}>
              <Button 
                variant="outline" 
                className="rounded-2xl h-12 px-8 font-black text-zinc-900 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
            </Link>
            <Button 
              className="rounded-2xl h-12 px-8 bg-[#00A991] hover:bg-[#008F7A] text-white font-black shadow-lg shadow-[#00A991]/20 transition-all active:scale-95"
            >
              Save Tower
            </Button>
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}
