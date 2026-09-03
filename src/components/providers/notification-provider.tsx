"use client";

import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { messaging, requestNotificationPermission } from "@/lib/firebase";

import { useNotificationStore } from "@/store/use-notification-store";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      // 1. Request permission and register token with backend
      await requestNotificationPermission();

      // 2. Setup foreground message listener
      try {
        const msg = await messaging();
        if (msg) {
          onMessage(msg, (payload) => {
            console.log("Message received in foreground: ", payload);
            
            // Extract notification details
            const title = payload.notification?.title || "New Notification";
            const body = payload.notification?.body || "";
            
            // Add to global store
            addNotification({
              title,
              message: body,
              type: "info",
              data: payload.data
            });

            // Show toast notification
            toast(title, {
              description: body,
              action: payload.data?.clickActionUrl ? {
                label: "View",
                onClick: () => {
                   window.location.href = payload.data!.clickActionUrl;
                }
              } : undefined,
            });
          });
        }
      } catch (err) {
        console.error("Failed to setup foreground message listener:", err);
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  return <>{children}</>;
}
