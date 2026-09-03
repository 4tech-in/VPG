import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "warning" | "info" | "error";
  data?: any;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, "id" | "time" | "read">) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      
      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            ...notif,
            id: Math.random().toString(36).substring(7),
            time: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ].slice(0, 50) // keep last 50
      })),

      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }))
    }),
    {
      name: 'notification-storage',
    }
  )
);
