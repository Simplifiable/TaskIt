import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import { Notification } from "@/types/notifications";

interface NotificationsListProps {
  notifications: Notification[];
  isLoading: boolean;
  formatTimestamp: (timestamp: any) => string;
}

export function NotificationsList({ notifications, isLoading, formatTimestamp }: NotificationsListProps) {
  return (
    <ScrollArea className="h-80">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Notifications</h4>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}