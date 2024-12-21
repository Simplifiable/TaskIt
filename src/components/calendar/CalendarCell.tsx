import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CalendarCellProps {
  date: Date;
  tasks: any[];
  onTasksClick: (date: Date, tasks: any[]) => void;
}

export function CalendarCell({ date, tasks, onTasksClick }: CalendarCellProps) {
  const tasksForDate = tasks.filter(task => 
    format(new Date(task.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );

  return (
    <div className="w-full h-full min-h-[100px]">
      <span>{format(date, 'd')}</span>
      {tasksForDate.length > 0 && (
        <button
          onClick={() => onTasksClick(date, tasksForDate)}
          className="mt-6 w-full"
        >
          <Badge variant="secondary" className="w-full">
            {tasksForDate.length} {tasksForDate.length === 1 ? 'task' : 'tasks'}
          </Badge>
        </button>
      )}
    </div>
  );
}