"use client"

import { useState } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface NewRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold text-zinc-900">New Indent Request</DialogTitle>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-500">Select Project</Label>
            <Select>
              <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-white shadow-sm font-medium text-zinc-400">
                <SelectValue placeholder="Choose project" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="twin-towers">VPG Twin Towers</SelectItem>
                <SelectItem value="royce">VPG Royce</SelectItem>
                <SelectItem value="grand">VPG Grand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-14 rounded-2xl border-zinc-100 font-bold hover:bg-zinc-50 text-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="h-14 rounded-2xl bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold shadow-lg shadow-[#00BFA5]/20"
            >
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
