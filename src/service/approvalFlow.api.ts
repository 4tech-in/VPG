import { apiRequest } from "@/lib/api-client"

export type ApprovalLevel = {
  level: number
  roleId: string | any
}

export type ApprovalFlow = {
  _id: string
  flowName: string
  moduleName: "indent" | "purchaseOrder"
  status: "active" | "inactive"
  levels: ApprovalLevel[]
  createdAt?: string
  updatedAt?: string
}

export type CreateApprovalFlowPayload = Omit<ApprovalFlow, "_id" | "createdAt" | "updatedAt">

export const approvalFlowService = {
  async getApprovalFlows(params?: { moduleName?: string; status?: string }): Promise<any> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value))
      })
    }
    const queryString = query.toString()
    return apiRequest<any>(`approval-flow${queryString ? `?${queryString}` : ""}`)
  },

  async createApprovalFlow(payload: CreateApprovalFlowPayload): Promise<ApprovalFlow> {
    return apiRequest<ApprovalFlow>("approval-flow", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateApprovalFlow(id: string, payload: Partial<CreateApprovalFlowPayload>): Promise<ApprovalFlow> {
    return apiRequest<ApprovalFlow>(`approval-flow/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteApprovalFlow(id: string): Promise<void> {
    return apiRequest(`approval-flow/${id}`, { method: "DELETE" })
  },
}
