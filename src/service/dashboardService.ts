import { apiRequest } from "@/lib/api-client";

export interface DashboardStats {
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  employeesOnLeave: number;
  pendingTasks: number;
  pendingTaskList?: any[];
  pendingLeaveRequests: number;
  absentList: any[];
  dateRange?: { startDate: string; endDate: string };
}

export const dashboardService = {
  getDashboardStats: async (
    projectId?: string,
    dateFilter?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (projectId) params.append("projectId", projectId);
    if (dateFilter) params.append("dateFilter", dateFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `dashboard${queryString}`;

    const response = await apiRequest<any>(url, {
      method: "GET",
    });
    return response;
  },
};
