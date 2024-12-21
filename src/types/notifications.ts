export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
  completedAt?: Date;
}