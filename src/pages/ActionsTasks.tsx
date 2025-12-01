import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllProjectTasks } from "@/hooks/useProjectTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Plus, CheckCircle, Clock, AlertCircle, Calendar, History } from "lucide-react";
import { EmptyTasks } from "@/components/empty-states/EmptyTasks";

export default function ActionsTasks() {
  const navigate = useNavigate();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const { data: tasks = [], isLoading, error } = useAllProjectTasks();

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setSelectedTask(null);
  };

  // Task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Unable to Load Tasks</h3>
          <p className="text-muted-foreground">
            There was an error loading your tasks. Please try refreshing.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Tasks & EOD</h1>
          <p className="text-muted-foreground">
            Manage your tasks and end-of-day submissions
          </p>
        </div>
        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* EOD Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Submit End of Day Report</CardTitle>
                <CardDescription>Log your daily work progress and accomplishments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/bd/actions/eod')}>
              <Calendar className="mr-2 h-4 w-4" />
              Submit EOD
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">My EOD Submissions</CardTitle>
                <CardDescription>View your past End of Day submissions and work history</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate('/bd/actions/eod-history')}>
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>View and manage your tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 ? (
            <EmptyTasks 
              onCreateTask={() => setShowTaskForm(true)}
            />
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskForm 
        open={showTaskForm}
        onOpenChange={handleCloseForm}
        task={selectedTask}
      />
    </div>
  );
}