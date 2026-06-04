"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StaffForm } from "./staff-form"
import { Staff } from "@/hooks/use-users"

interface StaffDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingStaff: Staff | null
  isSuperAdmin: boolean
  onSuccess: () => void
}

export function StaffDialog({
  isOpen,
  onOpenChange,
  editingStaff,
  isSuperAdmin,
  onSuccess,
}: StaffDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
        <DialogHeader className="pb-4 border-b border-zinc-100 mb-6">
          <DialogTitle className="text-2xl font-black">
            {editingStaff
              ? (isSuperAdmin ? "Update User Profile" : "Update Staff Profile")
              : (isSuperAdmin ? "Register New User" : "Register New Staff")}
          </DialogTitle>
          <DialogDescription className="font-medium text-zinc-500">
            {editingStaff
              ? (isSuperAdmin
                ? "Modify account permissions and professional details for this user."
                : "Modify account permissions and professional details for this member.")
              : (isSuperAdmin
                ? "Onboard a new user to the VPG Estate team."
                : "Onboard a new member to the VPG Estate team.")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <StaffForm
            isDialog
            onSuccess={onSuccess}
            initialValues={editingStaff || undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
