import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  tag: string;
  completed: boolean;
}

export default function Calendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.dueDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentMonth(newDate);
            }}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentMonth(newDate);
            }}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Card className="border rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 text-sm font-medium border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-4 text-center border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <CalendarComponent
            mode="single"
            month={currentMonth}
            className="w-full border-none"
            classNames={{
              months: "w-full",
              month: "w-full space-y-4",
              caption: "hidden",
              table: "w-full border-collapse",
              head_row: "hidden",
              row: "grid grid-cols-7 divide-x",
              cell: "min-h-[120px] p-2 relative border-t first:border-l",
              day: "absolute top-2 left-2 font-normal",
              day_selected: "bg-transparent text-foreground hover:bg-transparent hover:text-foreground",
              day_today: "bg-transparent text-primary font-bold hover:bg-transparent",
            }}
            components={{
              DayContent: ({ date }) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayTasks = groupedTasks[dateStr] || [];
                
                return (
                  <div className="w-full h-full">
                    <div className="text-sm">
                      {format(date, 'd')}
                    </div>
                    <div className="mt-6 space-y-1">
                      {dayTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="w-full text-xs p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-left truncate hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors cursor-pointer"
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.description && (
              <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {selectedTask?.tag}
              </span>
              <span className="text-xs text-muted-foreground">
                Due: {selectedTask?.dueDate}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}