"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { BusinessNodeManageForm } from "@/components/business-node-manage-form"
import { useBusinessNodes } from "@/hooks/use-business-nodes"
import { businessNodeService } from "@/service/businessNodes.api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function EditBusinessNodePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { editBusinessNode } = useBusinessNodes(1, 10, true) // skip fetching list

  const [initialData, setInitialData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNode = async () => {
      try {
        const data = await businessNodeService.getBusinessNodeById(id)
        setInitialData({
          id: data._id,
          name: data.name,
          type: data.type,
          parentNodeId: data.parentNodeId,
          isActive: data.isActive,
        })
      } catch (error: any) {
        toast.error("Failed to fetch business node details")
        router.push("/business-nodes")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) fetchNode()
  }, [id, router])

  if (isLoading) {
    return (
      <ContentLayout title="Edit Business Node">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Edit Business Node">
      <div className="p-4 sm:p-8 max-w-[1200px] mx-auto animate-in fade-in duration-200">
        <BusinessNodeManageForm 
          initialValues={initialData}
          onSubmit={async (values) => {
            await editBusinessNode(id, values)
          }}
        />
      </div>
    </ContentLayout>
  )
}
