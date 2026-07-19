import { apiRequest } from "@/lib/api-client";

export interface DashboardStats {
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  employeesOnLeave: number;
  pendingTasks: number;
  pendingLeaveRequests: number;
  absentList: any[];
}

export const dashboardService = {
  getDashboardStats: async (projectId?: string): Promise<DashboardStats> => {
    let url = "dashboard";
    if (projectId) {
      url += `?projectId=${projectId}`;
    }
    const response = await apiRequest<any>(url, {
      method: "GET",
    });
    return response.data;
  },
};
