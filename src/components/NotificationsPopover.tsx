import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInHours, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { NotificationsList } from "./notifications/NotificationsList";
import { Notification, Task } from "@/types/notifications";

export function NotificationsPopover() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    },
    enabled: !!user
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid),
        where("completed", "==", false),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    },
    enabled: !!user
  });

  const taskNotifications = tasks
    .filter(task => {
      // Only include tasks that explicitly have notifications enabled
      return task.notificationsEnabled === true;
    })
    .map(task => {
      const dueDatetime = parseISO(`${task.dueDate}T${task.dueTime}`);
      const hoursUntilDue = differenceInHours(dueDatetime, new Date());
      
      if (hoursUntilDue <= 0) {
        return {
          id: `task-${task.id}-due`,
          title: "Task Due Now",
          message: `The task "${task.title}" is due now!`,
          timestamp: new Date(),
          read: false
        };
      } else if (hoursUntilDue <= 24) {
        return {
          id: `task-${task.id}-1day`,
          title: "Task Due Soon",
          message: `The task "${task.title}" is due in ${hoursUntilDue} hours!`,
          timestamp: new Date(),
          read: false
        };
      } else if (hoursUntilDue <= 48) {
        return {
          id: `task-${task.id}-2days`,
          title: "Task Due Soon",
          message: `The task "${task.title}" is due in ${Math.floor(hoursUntilDue / 24)} days!`,
          timestamp: new Date(),
          read: false
        };
      }
      return null;
    }).filter(Boolean) as Notification[];

  const allNotifications = [...notifications, ...taskNotifications];
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const formatTimestamp = (timestamp: any) => {
    if (timestamp?.toDate) {
      return format(timestamp.toDate(), 'PPp');
    } else if (timestamp instanceof Date) {
      return format(timestamp, 'PPp');
    }
    return 'Unknown date';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <NotificationsList
          notifications={allNotifications}
          isLoading={isLoading}
          formatTimestamp={formatTimestamp}
        />
      </PopoverContent>
    </Popover>
  );
}