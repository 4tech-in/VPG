"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { StaffProfileContent } from "@/components/staff/staff-profile-content"

export default function StaffProfilePage({ params }: { params: { id: string } }) {
  const { id } = params
  
  return (
    <ContentLayout title="Staff Profile">
      <div className="p-4 sm:p-8">
        <StaffProfileContent id={id} />
      </div>
    </ContentLayout>
  )
}
