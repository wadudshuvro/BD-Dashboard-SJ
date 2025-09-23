import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Clock, Calendar, TrendingUp, Target, Zap, User, Award, AlertCircle, Plus } from "lucide-react";

export default function UserDashboard() {
  // Mock user data
  const user = {
    name: "John Doe",
    role: "Marketing Specialist",
    avatar: "",
    performance: 88,
    tasksCompleted: 23,
    tasksActive: 7,
    streak: 12,
    weeklyGoal: 30,
    weeklyProgress: 23
  };

  const recentTasks = [
    {
      id: "1",
      title: "Create social media content for Brand A",
      status: "completed",
      completedAt: "2024-01-10",
      brand: "Brand A"
    },
    {
      id: "2",
      title: "Review campaign performance metrics",
      status: "in_progress",
      dueDate: "2024-01-15",
      brand: "Brand B"
    },
    {
      id: "3",
      title: "Client presentation preparation",
      status: "todo",
      dueDate: "2024-01-18",
      brand: "Brand A"
    }
  ];

  const upcomingDeadlines = [
    {
      id: "1",
      title: "Q4 Campaign Report",
      dueDate: "2024-01-15",
      priority: "high",
      brand: "Brand A"
    },
    {
      id: "2",
      title: "Content Calendar Update",
      dueDate: "2024-01-17",
      priority: "medium",
      brand: "Brand C"
    },
    {
      id: "3",
      title: "Social Media Analytics",
      dueDate: "2024-01-20",
      priority: "low",
      brand: "Brand B"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'todo': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'todo': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your tasks and projects today.
          </p>
        </div>
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.performance}%</div>
            <div className="mt-2">
              <Progress value={user.performance} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +5% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{user.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{user.tasksActive}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{user.streak}</div>
            <p className="text-xs text-muted-foreground">
              Days active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tasks Completed This Week</span>
              <span className="text-sm text-muted-foreground">
                {user.weeklyProgress} / {user.weeklyGoal}
              </span>
            </div>
            <Progress 
              value={(user.weeklyProgress / user.weeklyGoal) * 100} 
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              {user.weeklyGoal - user.weeklyProgress} tasks remaining to reach your weekly goal
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className={`p-1 rounded-full ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {task.brand}
                    </Badge>
                    {task.status === 'completed' && task.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        Completed {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                    {task.status !== 'completed' && task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Tasks
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deadline.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {deadline.brand}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Due {new Date(deadline.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge variant={getPriorityColor(deadline.priority)} className="ml-2">
                  {deadline.priority}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="outline" className="justify-start">
              <User className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badge */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Great Work This Week!</h3>
              <p className="text-sm text-muted-foreground">
                You've completed {user.tasksCompleted} tasks and maintained a {user.streak}-day streak. 
                Keep up the excellent work!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}