"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { RoleManageForm } from "@/components/role-manage-form"
import { useRoles } from "@/hooks/use-roles"

export default function NewRolePage() {
  const { addRole } = useRoles()

  const handleSave = async (values: { 
    name: string; 
    scope: string; 
    permissions: string[]; 
  }) => {
    await addRole({
      ...values,
      canCreateRoles: [],
    })
  }

  return (
    <ContentLayout title="New Role">
      <div className="p-4 sm:p-8 max-w-[1200px] mx-auto animate-in fade-in duration-200">
        <RoleManageForm onSubmit={handleSave} />
      </div>
    </ContentLayout>
  )
}
