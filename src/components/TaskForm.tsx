import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type TaskFormData = {
  title: string;
  description?: string;
  dueDate: string;
  tag: string;
  customTag?: string;
  notifications: boolean;
};

export function TaskForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit } = useForm<TaskFormData>();
  const [selectedTag, setSelectedTag] = useState("work");
  const { user } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (data: TaskFormData) => {
    try {
      const taskData = {
        ...data,
        tag: selectedTag === "custom" ? data.customTag : selectedTag,
        userId: user?.uid,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "tasks"), taskData);
      toast({
        title: "Success",
        description: "Task added successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title", { required: true })} />
      </div>
      
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input type="datetime-local" id="dueDate" {...register("dueDate", { required: true })} />
      </div>
      
      <div>
        <Label>Tag</Label>
        <RadioGroup value={selectedTag} onValueChange={setSelectedTag} className="flex flex-col space-y-2">
          {["work", "personal", "health", "house", "school", "family", "custom"].map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <RadioGroupItem value={tag} id={tag} />
              <Label htmlFor={tag}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</Label>
            </div>
          ))}
        </RadioGroup>
        
        {selectedTag === "custom" && (
          <Input
            placeholder="Enter custom tag"
            className="mt-2"
            {...register("customTag")}
          />
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="notifications"
          {...register("notifications")}
        />
        <Label htmlFor="notifications">Enable notifications</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Add Task</Button>
      </div>
    </form>
  );
}