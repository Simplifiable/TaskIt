import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { startOfToday, parseISO, isBefore, parse, differenceInHours } from "date-fns";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title must be 50 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  dueDate: z.string().refine((date) => {
    return !isBefore(parseISO(date), startOfToday());
  }, "Due date cannot be in the past"),
  dueTime: z.string(),
  tag: z.string().max(50, "Tag must be 50 characters or less"),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    dueTime?: string;
    tag: string;
  };
  onClose: () => void;
}

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
      dueTime: task?.dueTime || new Date().toTimeString().slice(0, 5),
      tag: task?.tag || "",
    },
  });

  const scheduleNotifications = async (taskId: string, dueDate: string, dueTime: string) => {
    if (!user || !notificationsEnabled) return;

    const dueDatetime = parse(`${dueDate} ${dueTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const hoursUntilDue = differenceInHours(dueDatetime, new Date());

    const notifications = [];

    if (hoursUntilDue > 48) {
      notifications.push({
        taskId,
        userId: user.uid,
        title: "Task Due Soon",
        message: "Task is due in 2 days",
        scheduledFor: dueDatetime,
        read: false,
        timestamp: new Date(),
      });
    }

    if (hoursUntilDue > 24) {
      notifications.push({
        taskId,
        userId: user.uid,
        title: "Task Due Tomorrow",
        message: "Task is due in 24 hours",
        scheduledFor: dueDatetime,
        read: false,
        timestamp: new Date(),
      });
    }

    notifications.push({
      taskId,
      userId: user.uid,
      title: "Task Due Now",
      message: "Task is due now",
      scheduledFor: dueDatetime,
      read: false,
      timestamp: new Date(),
    });

    for (const notification of notifications) {
      await addDoc(collection(db, "notifications"), notification);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    if (!user) return;

    try {
      if (task) {
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, {
          ...data,
          updatedAt: new Date(),
          notificationsEnabled, // Add this line to store the notifications preference
        });

        if (notificationsEnabled) {
          await scheduleNotifications(task.id, data.dueDate, data.dueTime);
          await addDoc(collection(db, "notifications"), {
            userId: user.uid,
            title: "Task Updated",
            message: `Task "${data.title}" has been updated`,
            timestamp: new Date(),
            read: false,
          });
        }

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        const docRef = await addDoc(collection(db, "tasks"), {
          ...data,
          userId: user.uid,
          completed: false,
          createdAt: new Date(),
          notificationsEnabled, // Add this line to store the notifications preference
        });

        if (notificationsEnabled) {
          await scheduleNotifications(docRef.id, data.dueDate, data.dueTime);
          await addDoc(collection(db, "notifications"), {
            userId: user.uid,
            title: "New Task",
            message: `New task "${data.title}" has been created`,
            timestamp: new Date(),
            read: false,
          });
        }

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            {...register("dueDate")}
          />
          {errors.dueDate && (
            <p className="text-sm text-destructive">{errors.dueDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueTime">Due Time</Label>
          <Input
            id="dueTime"
            type="time"
            {...register("dueTime")}
          />
          {errors.dueTime && (
            <p className="text-sm text-destructive">{errors.dueTime.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tag">Tag</Label>
        <Input id="tag" {...register("tag")} />
        {errors.tag && (
          <p className="text-sm text-destructive">{errors.tag.message}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="notifications"
          checked={notificationsEnabled}
          onCheckedChange={setNotificationsEnabled}
        />
        <Label htmlFor="notifications">Enable notifications</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{task ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}