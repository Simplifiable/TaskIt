import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    tag: string;
  };
  onClose: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  tag: string;
}

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { register, handleSubmit } = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate || "",
      tag: task?.tag || "",
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    if (!user) return;

    try {
      if (task) {
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, {
          ...data,
          updatedAt: new Date(),
        });

        if (notificationsEnabled) {
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
        await addDoc(collection(db, "tasks"), {
          ...data,
          userId: user.uid,
          completed: false,
          createdAt: new Date(),
        });

        if (notificationsEnabled) {
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
        <Input id="title" {...register("title", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          {...register("dueDate", { required: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tag">Tag</Label>
        <Input id="tag" {...register("tag", { required: true })} />
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