import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarCell } from "@/components/calendar/CalendarCell";
import { TasksList } from "@/components/calendar/TasksList";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);

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

  const handleTasksClick = (date: Date, tasksForDate: Task[]) => {
    setSelectedDate(date);
    setSelectedTasks(tasksForDate);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-7/12">
          <Card className="border rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentMonth(newDate);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentMonth(newDate);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
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
                  head_row: "grid grid-cols-7",
                  head_cell: "text-muted-foreground font-normal text-[0.8rem] p-2 text-center",
                  row: "grid grid-cols-7",
                  cell: "min-h-[100px] p-2 relative border hover:bg-muted/50 transition-colors",
                  day: "absolute top-2 left-2 font-normal text-sm",
                  day_selected: "bg-transparent text-foreground hover:bg-transparent hover:text-foreground",
                  day_today: "bg-transparent text-primary font-bold hover:bg-transparent",
                }}
                components={{
                  DayContent: ({ date }) => (
                    <CalendarCell
                      date={date}
                      tasks={tasks}
                      onTasksClick={handleTasksClick}
                    />
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-5/12">
          <TasksList
            date={selectedDate}
            tasks={selectedTasks}
            onTaskClick={setSelectedTask}
          />
        </div>
      </div>

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
              <Badge variant="secondary">
                {selectedTask?.tag}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Due: {selectedTask?.dueDate && format(new Date(selectedTask.dueDate), 'PPp')}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}