import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  tag: string;
  completed: boolean;
}

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
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

  const selectedDateTasks = tasks.filter(task => 
    task.dueDate === (date ? format(date, 'yyyy-MM-dd') : '')
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">
              Tasks for {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
            </h2>
            <div className="space-y-4">
              {selectedDateTasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mt-2 inline-block">
                    {task.tag}
                  </span>
                </div>
              ))}
              {selectedDateTasks.length === 0 && (
                <p className="text-muted-foreground">No tasks for this date</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}