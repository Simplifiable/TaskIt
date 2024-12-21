import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TasksListProps {
  date: Date;
  tasks: any[];
  onTaskClick: (task: any) => void;
}

export function TasksList({ date, tasks, onTaskClick }: TasksListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Tasks for {format(date, 'MMMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks for this day</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onTaskClick(task)}
              >
                <div className="space-y-1">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {task.tag}
                    </Badge>
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
  );
}