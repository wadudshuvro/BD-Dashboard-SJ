import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Mail, Phone, MapPin, Calendar, TrendingUp, Clock, CheckCircle, MoreVertical, Search, Filter } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'active' | 'busy' | 'away' | 'offline';
  department: string;
  location: string;
  joinDate: string;
  tasksCompleted: number;
  tasksActive: number;
  performance: number;
  weeklySummary: string;
  skills: string[];
  clients: string[];
  brands: string[];
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Project Manager",
    status: "active",
    department: "Marketing",
    location: "New York, NY",
    joinDate: "2023-01-15",
    tasksCompleted: 87,
    tasksActive: 12,
    performance: 94,
    weeklySummary: "Excellent performance this week. Successfully launched two major campaigns and improved client satisfaction scores by 15%.",
    skills: ["Project Management", "Digital Marketing", "Client Relations"],
    clients: ["TechCorp", "RetailPlus"],
    brands: ["Brand A", "Brand B"]
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "Marketing Specialist",
    status: "busy",
    department: "Marketing",
    location: "San Francisco, CA",
    joinDate: "2023-03-22",
    tasksCompleted: 64,
    tasksActive: 8,
    performance: 88,
    weeklySummary: "Strong week with focus on social media campaigns. Achieved 23% increase in engagement across all platforms.",
    skills: ["Social Media", "Content Creation", "Analytics"],
    clients: ["StartupXYZ", "FashionCo"],
    brands: ["Brand C", "Brand D"]
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    role: "Content Creator",
    status: "active",
    department: "Creative",
    location: "Austin, TX",
    joinDate: "2023-05-10",
    tasksCompleted: 52,
    tasksActive: 15,
    performance: 91,
    weeklySummary: "Outstanding creative output this week. Produced 12 high-quality pieces of content and received excellent client feedback.",
    skills: ["Content Writing", "Graphic Design", "Video Editing"],
    clients: ["MediaGroup", "TechCorp"],
    brands: ["Brand A", "Brand E"]
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@company.com",
    role: "Data Analyst",
    status: "away",
    department: "Analytics",
    location: "Seattle, WA",
    joinDate: "2023-02-28",
    tasksCompleted: 76,
    tasksActive: 6,
    performance: 96,
    weeklySummary: "Exceptional analytical work this week. Identified key performance insights that led to 18% improvement in campaign ROI.",
    skills: ["Data Analysis", "Statistical Modeling", "Reporting"],
    clients: ["RetailPlus", "StartupXYZ"],
    brands: ["Brand B", "Brand C"]
  }
];

export default function People() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'busy': return 'Busy';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const avgPerformance = Math.round(teamMembers.reduce((acc, m) => acc + m.performance, 0) / teamMembers.length);
  const totalTasks = teamMembers.reduce((acc, m) => acc + m.tasksCompleted, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">People</h1>
        <p className="text-muted-foreground">
          Manage your team members, track performance, and view AI-generated insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeMembers / totalMembers) * 100)}% of team
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Team Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>Assign Task</DropdownMenuItem>
                    <DropdownMenuItem>View Performance</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status and Contact */}
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {getStatusText(member.status)}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{member.location}</span>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance</span>
                  <span>{member.performance}%</span>
                </div>
                <Progress value={member.performance} className="h-2" />
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-green-600">{member.tasksCompleted}</div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{member.tasksActive}</div>
                  <div className="text-muted-foreground">Active</div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="text-sm font-medium mb-2">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {member.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Summary */}
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Weekly AI Summary</div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {member.weeklySummary}
                </p>
              </div>

              {/* Clients & Brands */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Clients: </span>
                  <span className="text-muted-foreground">
                    {member.clients.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Brands: </span>
                  <span className="text-muted-foreground">
                    {member.brands.join(', ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No team members found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
}