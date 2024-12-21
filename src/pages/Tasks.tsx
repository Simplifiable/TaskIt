import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isBefore, formatDistanceToNow, differenceInHours } from "date-fns";
import { CheckCircle2, Circle, Search, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime: string;
  tag: string;
  completed: boolean;
  completedAt?: Date;
}

export default function Tasks() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((task: any) => {
          if (!task.completed) return true;
          const completedDate = task.completedAt?.toDate();
          if (!completedDate) return true;
          const hoursSinceCompletion = differenceInHours(new Date(), completedDate);
          return hoursSinceCompletion < 24;
        }) as Task[];
    },
    enabled: !!user
  });

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { 
        completed: !completed,
        completedAt: !completed ? new Date() : null
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: completed ? "Task marked as incomplete" : "Task marked as complete",
        description: "Task status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskOpen(true);
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const date = format(parseISO(task.dueDate), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
    parseISO(a).getTime() - parseISO(b).getTime()
  );

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="p-4 border rounded-lg mb-2 bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {task.tag}
            </span>
            <span className="text-xs text-muted-foreground">
              {isBefore(parseISO(task.dueDate), new Date()) 
                ? `Overdue by ${formatDistanceToNow(parseISO(task.dueDate))}`
                : `Due ${formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}`
              }
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTaskComplete(task.id, task.completed)}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditTask(task)}
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteTask(task.id)}
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Button onClick={() => setIsAddTaskOpen(true)}>Add Task</Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tasks by title or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map(date => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {format(parseISO(date), 'MMMM d, yyyy')}
                <span className="text-sm font-normal text-muted-foreground">
                  {groupedTasks[date].length} tasks
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupedTasks[date].map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <TaskForm onClose={() => {
            setIsAddTaskOpen(false);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onClose={() => {
              setIsEditTaskOpen(false);
              setEditingTask(null);
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
