import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Users, 
  Menu,
  X,
  Bot,
  Wrench,
  FolderOpen,
  Building2,
  Zap,
  Target
} from "lucide-react";
import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

interface LayoutProps {
  userRole?: 'super_admin' | 'manager' | 'pm' | 'user';
}

const Layout = ({ userRole }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  
  // Use the actual user role if available, otherwise fall back to prop
  const currentRole = user?.role || userRole || 'user';
  
  // Base path for current role
  const getBasePath = (role: string) => {
    switch (role) {
      case 'super_admin': return '/adminpanel';
      case 'manager': return '/manager';
      case 'pm': return '/pm';
      case 'user': return '/user';
      default: return '/user';
    }
  };
  
  const basePath = getBasePath(currentRole);

  // Get navigation based on role
  const getNavigation = (role: string) => {
    const baseNavigation = [
      { name: "Dashboard", href: `${basePath}/dashboard`, icon: LayoutDashboard, current: false },
    ];

    switch (role) {
      case 'super_admin':
        return [
          { name: "Overview", href: "/adminpanel", icon: LayoutDashboard, current: false },
          { name: "Brands", href: "/adminpanel/brands", icon: Building2, current: false },
          { name: "Users", href: "/adminpanel/users", icon: Users, current: false },
          { name: "Clients", href: "/adminpanel/clients", icon: Users, current: false },
          { name: "Projects", href: "/adminpanel/projects", icon: FolderOpen, current: false },
          { name: "Integrations", href: "/adminpanel/integrations", icon: Zap, current: false },
          { name: "KPIs", href: "/adminpanel/kpis", icon: Target, current: false },
          { name: "Settings", href: "/adminpanel/settings", icon: Settings, current: false },
        ];
      
      case 'manager':
        return [
          ...baseNavigation,
          { name: "AI Workspace", href: `${basePath}/workspace`, icon: Bot, current: false },
          { name: "Clients", href: `${basePath}/clients`, icon: Users, current: false },
          { name: "Projects", href: `${basePath}/projects`, icon: FolderOpen, current: false },
          { name: "Brands", href: `${basePath}/brands`, icon: Building2, current: false },
          { name: "Actions & Tasks", href: `${basePath}/actions-tasks`, icon: CheckSquare, current: false },
          { name: "People", href: `${basePath}/people`, icon: Users, current: false },
        ];
      
      case 'pm':
        return [
          ...baseNavigation,
          { name: "AI Workspace", href: `${basePath}/workspace`, icon: Bot, current: false },
          { name: "Clients", href: `${basePath}/clients`, icon: Users, current: false },
          { name: "Projects", href: `${basePath}/projects`, icon: FolderOpen, current: false },
          { name: "Tasks", href: `${basePath}/tasks`, icon: Target, current: false },
          { name: "Reports", href: `${basePath}/reports`, icon: BarChart3, current: false },
        ];
      
      case 'user':
      default:
        return [
          ...baseNavigation,
          { name: "AI Workspace", href: `${basePath}/workspace`, icon: Bot, current: false },
          { name: "Reports", href: `${basePath}/reports`, icon: BarChart3, current: false },
          { name: "People", href: `${basePath}/people`, icon: Users, current: false },
          { name: "Brands", href: `${basePath}/brands`, icon: Building2, current: false },
        ];
    }
  };

  const navigation = getNavigation(currentRole);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-sm border-r border-border
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">MarketingIQ</h1>
                <p className="text-xs text-muted-foreground capitalize">{currentRole.replace('_', ' ')} Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-smooth
                  ${isActive 
                    ? 'bg-gradient-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-border">
            <ProfileDropdown />
          </div>
        </div>

        {/* Mobile close button */}
        <button
          className="absolute top-4 right-4 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-border bg-card/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-muted-foreground" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-foreground">
                {navigation.find(item => window.location.pathname.includes(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <ProfileDropdown />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;