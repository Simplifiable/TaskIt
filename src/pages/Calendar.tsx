import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

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

  const today = new Date();
  const firstDay = startOfMonth(today);
  const lastDay = endOfMonth(today);

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.dueDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const modifiers = {
    hasTasks: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return !!groupedTasks[dateStr]?.length;
    }
  };

  const modifiersStyles = {
    hasTasks: {
      backgroundColor: 'var(--primary)',
      color: 'white',
      borderRadius: '50%'
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <div className="grid gap-6">
        <Card className="p-4">
          <CardContent className="p-0">
            <CalendarComponent
              mode="single"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
              components={{
                DayContent: ({ date }) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayTasks = groupedTasks[dateStr] || [];
                  
                  return (
                    <div className="w-full h-full min-h-[100px] p-2">
                      <div className="text-sm font-medium">
                        {format(date, 'd')}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="text-xs p-1 rounded bg-primary/10 truncate"
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}