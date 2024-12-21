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

  const selectedDate = format(new Date(), 'MMMM d, yyyy');
  const todaysTasks = tasks.filter(task => 
    format(parseISO(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-7/12">
          <Card className="border rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentMonth(newDate);
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
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
                    <ChevronRight className="h-5 w-5" />
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
                  head_cell: "text-muted-foreground font-normal text-sm p-2 text-center",
                  row: "grid grid-cols-7",
                  cell: "min-h-[120px] p-2 relative border hover:bg-muted/50 transition-colors",
                  day: "absolute top-2 left-2 font-normal",
                  day_selected: "bg-transparent text-foreground hover:bg-transparent hover:text-foreground",
                  day_today: "bg-transparent text-primary font-bold hover:bg-transparent",
                }}
                components={{
                  DayContent: ({ date }) => (
                    <div className="w-full h-full">
                      <span>{format(date, 'd')}</span>
                      <div className="mt-6 space-y-1">
                        {tasks
                          .filter(task => format(parseISO(task.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
                          .map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="w-full text-xs p-1.5 rounded bg-primary/10 text-primary text-left truncate hover:bg-primary/20 transition-colors cursor-pointer"
                              title={task.title}
                            >
                              {task.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-5/12">
          <Card>
            <CardHeader>
              <CardTitle>Tasks for {selectedDate}</CardTitle>
            </CardHeader>
            <CardContent>
              {todaysTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks for today</p>
              ) : (
                <div className="space-y-4">
                  {todaysTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {task.tag}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Due: {format(parseISO(task.dueDate), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
