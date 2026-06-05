"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { RoleManageForm } from "@/components/role-manage-form"
import { useRoles } from "@/hooks/use-roles"

export default function EditRolePage() {
  const params = useParams()
  const router = useRouter()
  const { allRoles, editRole, isLoading } = useRoles()

  const roleId = typeof params.id === "string" ? params.id : ""

  const activeRole = useMemo(() => {
    return allRoles.find((r) => r.id === roleId)
  }, [allRoles, roleId])

  const handleSave = async (values: { 
    name: string; 
    scope: string; 
    permissions: string[]; 
    organizationId?: string;
  }) => {
    if (!roleId) return
    await editRole(roleId, values)
  }

  if (!activeRole) {
    if (isLoading) {
      return (
        <ContentLayout title="Edit Role">
          <div className="p-8 text-center text-zinc-500 text-sm font-medium">
            Retrieving role configurations...
          </div>
        </ContentLayout>
      )
    }

    return (
      <ContentLayout title="Edit Role">
        <div className="p-8 text-center">
          <p className="text-zinc-500 text-sm font-medium">Role configuration not found.</p>
          <button 
            onClick={() => router.push("/roles")}
            className="text-xs text-primary font-bold hover:underline mt-2"
          >
            Back to Roles
          </button>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Edit Role">
      <div className="p-4 sm:p-8 max-w-[1200px] mx-auto animate-in fade-in duration-200">
        <RoleManageForm 
          initialValues={{
            id: activeRole.id,
            name: activeRole.name,
            scope: activeRole.scope,
            permissions: activeRole.permissions,
            organizationId: activeRole.organizationId,
          }}
          onSubmit={handleSave} 
          showOrganizationSelect={true}
        />
      </div>
    </ContentLayout>
  )
}
