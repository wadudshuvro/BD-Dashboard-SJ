import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Users,
  Target,
  Clock,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useProjects, type Project, type CreateProjectData } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { useForm, Controller } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { EmptyProjects } from "@/components/empty-states/EmptyProjects";
import { ProjectCardSkeleton } from "@/components/skeleton/ProjectCardSkeleton";

const statusColors = {
  planning: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
};

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
};

export default function ProjectManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { 
    projects, 
    loading, 
    error, 
    totalCount,
    createProject, 
    updateProject, 
    deleteProject 
  } = useProjects({
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    client_id: clientFilter === 'all' ? undefined : clientFilter
  });

  const { clients } = useClients({});

  const { register, handleSubmit, reset, setValue, watch, control } = useForm<CreateProjectData>();

  const handleCreateProject = async (data: CreateProjectData) => {
    try {
      await createProject(data);
      setIsCreateDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async (data: CreateProjectData) => {
    if (!editingProject) return;
    
    try {
      await updateProject(editingProject.id, data);
      setEditingProject(null);
      reset();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    // Pre-fill form with project data
    Object.entries(project).forEach(([key, value]) => {
      if (key === 'start_date' || key === 'end_date' || key === 'deadline') {
        setValue(key as keyof CreateProjectData, value ? value.split('T')[0] : undefined as any);
      } else {
        setValue(key as keyof CreateProjectData, value as any);
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Target className="h-4 w-4" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <Target className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <FolderOpen className="h-4 w-4" />;
    }
  };

  const calculateProjectStats = () => {
    const stats = {
      total: projects.length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      overdue: projects.filter(p => {
        if (!p.deadline) return false;
        return new Date(p.deadline) < new Date() && p.status !== 'completed';
      }).length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      avgProgress: projects.length > 0 
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0
    };
    return stats;
  };

  const stats = calculateProjectStats();

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Track and manage all your client projects</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl">
        <AlertDescription>
          Error loading projects: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Track and manage all your client projects
          </p>
        </div>
        
        <Dialog 
          open={isCreateDialogOpen || !!editingProject} 
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingProject(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(editingProject ? handleEditProject : handleCreateProject)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" {...register("name", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client *</Label>
                  <Controller
                    name="client_id"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} rows={3} />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input 
                    id="progress" 
                    type="number" 
                    min="0" 
                    max="100"
                    {...register("progress", { valueAsNumber: true })} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  min="0"
                  step="0.01"
                  {...register("budget", { valueAsNumber: true })} 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input 
                    id="start_date" 
                    type="date" 
                    {...register("start_date")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input 
                    id="end_date" 
                    type="date" 
                    {...register("end_date")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    {...register("deadline")} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingProject(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProject ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalBudget / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyProjects />
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                <TableRow 
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{project.client?.name}</div>
                      {project.client?.company && (
                        <div className="text-sm text-muted-foreground">
                          {project.client.company}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={statusColors[project.status]} variant="outline">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(project.status)}
                        <span>{project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={priorityColors[project.priority]} variant="outline">
                      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {project.budget && (
                        <div className="text-sm font-medium">
                          ${project.budget.toLocaleString()}
                        </div>
                      )}
                      {project.actual_cost !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          Spent: ${project.actual_cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {project.deadline && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className={`text-sm ${
                          new Date(project.deadline) < new Date() && project.status !== 'completed' 
                            ? 'text-red-600' 
                            : ''
                        }`}>
                          {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/adminpanel/projects/${project.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}