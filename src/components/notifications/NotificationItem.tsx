import { format } from "date-fns";
import { Notification } from "@/types/notifications";

interface NotificationItemProps {
  notification: Notification;
  formatTimestamp: (timestamp: any) => string;
}

export function NotificationItem({ notification, formatTimestamp }: NotificationItemProps) {
  return (
    <div className="flex flex-col space-y-1 border-b pb-4 last:border-0">
      <p className="text-sm font-medium">{notification.title}</p>
      <p className="text-sm text-muted-foreground">
        {notification.message}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatTimestamp(notification.timestamp)}
      </p>
    </div>
  );
}