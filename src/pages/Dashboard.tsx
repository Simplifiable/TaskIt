import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isTomorrow, isBefore, parseISO, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
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
}

export default function Dashboard() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    },
    enabled: !!user
  });

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { completed: !completed });
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

  const filterTasks = (filterFn: (date: Date) => boolean) => {
    return tasks.filter(task => {
      const dueDateTime = parseISO(`${task.dueDate}T${task.dueTime}`);
      return filterFn(dueDateTime);
    });
  };

  const todayTasks = filterTasks(isToday);
  const tomorrowTasks = filterTasks(isTomorrow);
  const overdueTasks = filterTasks(date => isBefore(date, new Date()) && !isToday(date));

  const getFormattedDueDateTime = (task: Task) => {
    const dateTime = parseISO(`${task.dueDate}T${task.dueTime}`);
    if (isBefore(dateTime, new Date())) {
      return `Overdue by ${formatDistanceToNow(dateTime)}`;
    }
    return `Due ${formatDistanceToNow(dateTime, { addSuffix: true })}`;
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div key={task.id} className="p-4 border rounded-lg mb-2 bg-card hover:bg-accent/50 transition-colors">
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
              {getFormattedDueDateTime(task)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleTaskComplete(task.id, task.completed)}
          className="shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {user?.displayName || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button onClick={() => setIsAddTaskOpen(true)}>Add Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Today
              <span className="text-sm font-normal text-muted-foreground">
                {todayTasks.length} tasks
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tomorrow
              <span className="text-sm font-normal text-muted-foreground">
                {tomorrowTasks.length} tasks
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tomorrowTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Overdue
              <span className="text-sm font-normal text-muted-foreground">
                {overdueTasks.length} tasks
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
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
    </div>
  );
}