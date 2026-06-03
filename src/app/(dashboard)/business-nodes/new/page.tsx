"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { BusinessNodeManageForm } from "@/components/business-node-manage-form"
import { useBusinessNodes } from "@/hooks/use-business-nodes"

export default function NewBusinessNodePage() {
  const { addBusinessNode } = useBusinessNodes()

  return (
    <ContentLayout title="New Business Node">
      <div className="p-4 sm:p-8 max-w-[1200px] mx-auto animate-in fade-in duration-200">
        <BusinessNodeManageForm onSubmit={addBusinessNode} />
      </div>
    </ContentLayout>
  )
}
