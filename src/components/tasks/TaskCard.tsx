import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProjectTask, useUpdateProjectTask, useDeleteProjectTask } from "@/hooks/useProjectTasks";
import { MoreHorizontal, Clock, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: ProjectTask;
  onEdit?: (task: ProjectTask) => void;
}

const getStatusColor = (status: ProjectTask['status']) => {
  switch (status) {
    case 'todo':
      return 'bg-slate-100 text-slate-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'review':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getPriorityColor = (priority: ProjectTask['priority']) => {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const updateTask = useUpdateProjectTask();
  const deleteTask = useDeleteProjectTask();

  const handleStatusChange = (newStatus: ProjectTask['status']) => {
    updateTask.mutate({
      id: task.id,
      updates: { status: newStatus }
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight">
            {task.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                Mark as To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('review')}>
                Mark as In Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                Mark as Blocked
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={getStatusColor(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>

        {task.projects && (
          <div className="text-xs text-muted-foreground">
            <strong>Project:</strong> {task.projects.name}
            {task.projects.clients && (
              <span> • <strong>Client:</strong> {task.projects.clients.name}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_hours}h est.</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due {format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>
          {task.assigned_user && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assigned_user.first_name} {task.assigned_user.last_name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}