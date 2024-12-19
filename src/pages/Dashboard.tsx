import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isTomorrow, isBefore, parseISO } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  tag: string;
  completed: boolean;
}

export default function Dashboard() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;
    
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const tasksData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
    
    setTasks(tasksData);
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const filterTasks = (filterFn: (date: Date) => boolean) => {
    return tasks.filter(task => {
      const dueDate = parseISO(task.dueDate);
      return filterFn(dueDate);
    });
  };

  const todayTasks = filterTasks(isToday);
  const tomorrowTasks = filterTasks(isTomorrow);
  const overdueTasks = filterTasks(date => isBefore(date, new Date()) && !isToday(date));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => setIsAddTaskOpen(true)}>Add Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.map(task => (
              <div key={task.id} className="p-2 border-b">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-gray-500">{task.tag}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tomorrow</CardTitle>
          </CardHeader>
          <CardContent>
            {tomorrowTasks.map(task => (
              <div key={task.id} className="p-2 border-b">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-gray-500">{task.tag}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.map(task => (
              <div key={task.id} className="p-2 border-b">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-gray-500">{task.tag}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onClose={() => setIsAddTaskOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}