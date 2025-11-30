import { useState, useMemo, useCallback } from "react";
import {
  NotificationContext,
  Notification,
  NotificationType,
} from "./notificationContext";

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    try {
      console.debug("NotificationProvider: Removing notification", {
        notificationId: id,
        timestamp: new Date().toISOString(),
      });

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("NotificationProvider: Error removing notification", {
        error: error instanceof Error ? error.message : "Unknown error",
        notificationId: id,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const addNotification = useCallback(
    (message: string, type: NotificationType, duration: number = 5000) => {
      try {
        console.info("NotificationProvider: Showing notification", {
          type,
          message:
            message.substring(0, 100) + (message.length > 100 ? "..." : ""),
          duration,
          timestamp: new Date().toISOString(),
        });

        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
          id,
          message: message.trim() || "Unknown error occurred",
          type,
          duration,
        };

        setNotifications((prev) => {
          const updated = [...prev, newNotification];
          console.debug("NotificationProvider: Updated notification list", {
            totalNotifications: updated.length,
            newNotificationId: id,
            timestamp: new Date().toISOString(),
          });
          return updated;
        });

        setTimeout(() => {
          removeNotification(id);
        }, duration);
      } catch (error) {
        console.error("NotificationProvider: Error showing notification", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          originalMessage: message,
          type,
          timestamp: new Date().toISOString(),
        });

        alert(`${type.toUpperCase()}: ${message}`);
      }
    },
    [removeNotification]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      console.log("NotificationProvider: Success notification requested", {
        message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        duration: duration || 3000,
        timestamp: new Date().toISOString(),
      });

      addNotification(message, "success", duration);
    },
    [addNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      console.warn("NotificationProvider: Error notification requested", {
        message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        duration: duration || 5000,
        timestamp: new Date().toISOString(),
      });

      addNotification(message, "error", duration);
    },
    [addNotification]
  );

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      showSuccess,
      showError,
    }),
    [notifications, addNotification, removeNotification, showSuccess, showError]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
