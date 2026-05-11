"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { StaffForm } from "@/components/staff/staff-form"

export default function NewStaffPage() {
  return (
    <ContentLayout title="Add New Staff">
      <div className="p-4 sm:p-8">
        <StaffForm />
      </div>
    </ContentLayout>
  )
}
