import { apiRequest } from "@/lib/api-client";

export const materialIssueService = {
  async getMaterialUsageHistory(params?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
      });
    }
    const queryString = query.toString();
    const response = await apiRequest<any>(
      `material-issues/usage-history${queryString ? `?${queryString}` : ""}`,
    );

    return response?.data || response;
  }
};
