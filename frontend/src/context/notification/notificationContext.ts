import { createContext } from "react";

export type NotificationType = "success" | "error";

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
};

export type NotificationContextType = {
  notifications: Notification[];
  addNotification: (
    message: string,
    type: NotificationType,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
};

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
