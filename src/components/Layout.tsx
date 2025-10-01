import { Outlet, NavLink, useLocation } from "react-router-dom";
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
  Target,
  Shield
} from "lucide-react";
import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import logo from "@/assets/logo-sji.png";

interface LayoutProps {
  userRole?: 'super_admin' | 'manager' | 'pm' | 'user';
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  isHeader?: boolean;
  isAdmin?: boolean;
}

const Layout = ({ userRole }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Use the actual user role if available, otherwise fall back to prop
  const currentRole = user?.role || userRole || 'user';
  
  // Base path for current role
  const getBasePath = (role: string) => {
    switch (role) {
      case 'super_admin': return '/dashboard'; // Super admin has own dashboard
      case 'manager': return '/manager';
      case 'pm': return '/pm';
      case 'user': return '/user';
      default: return '/user';
    }
  };
  
  const basePath = getBasePath(currentRole);

  // Get navigation based on role
  const getNavigation = (role: string): NavigationItem[] => {
    const baseNavigation = [
      { name: "Dashboard", href: `${basePath}/dashboard`, icon: LayoutDashboard, current: false },
    ];

    switch (role) {
      case 'super_admin':
        // Super admin gets clean navigation
        return [
          ...baseNavigation,
          { name: "AI Workspace", href: `${basePath}/workspace`, icon: Bot, current: false },
          { name: "My Agents", href: `${basePath}/my-agents`, icon: Zap, current: false },
          { name: "Brands", href: `${basePath}/brands`, icon: Building2, current: false },
          { name: "Actions & Tasks", href: `${basePath}/actions-tasks`, icon: CheckSquare, current: false },
          { name: "People", href: `${basePath}/people`, icon: Users, current: false },
          { name: "SEPARATOR", href: "", icon: null, current: false, isHeader: true },
          { name: "Admin Panel", href: "/adminpanel", icon: Shield, current: false, isAdmin: true },
        ];
      
      case 'manager':
        return [
          ...baseNavigation,
          { name: "AI Workspace", href: `${basePath}/workspace`, icon: Bot, current: false },
          { name: "My Agents", href: `${basePath}/my-agents`, icon: Zap, current: false },
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
          { name: "My Agents", href: `${basePath}/my-agents`, icon: Zap, current: false },
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
          { name: "My Agents", href: `${basePath}/my-agents`, icon: Zap, current: false },
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
        transition-transform duration-300 ease-in-out lg:translate-x-0
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-auto items-center justify-center px-6 py-4 border-b border-border">
            <div className="flex flex-col items-center gap-2">
              <img src={logo} alt="SJ Innovation" className="h-20 w-auto" />
              <p className="text-sm font-semibold text-foreground tracking-tight">Marketing Intelligence Hub</p>
              <p className="text-xs text-muted-foreground capitalize">{currentRole.replace('_', ' ')} Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item, index) => {
              // Handle separator
              if (item.name === "SEPARATOR") {
                return (
                  <div key={`separator-${index}`} className="my-4">
                    <div className="border-t border-border/50"></div>
                  </div>
                );
              }

              // Handle header items (non-clickable)
              if (item.isHeader) {
                return (
                  <div key={item.name} className="flex items-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </div>
                );
              }
              
              // Special styling for Admin Panel
              const isAdminPanel = item.isAdmin;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-smooth
                    ${isActive 
                      ? isAdminPanel 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25' 
                        : 'bg-gradient-primary text-white shadow-md'
                      : isAdminPanel
                        ? 'text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:shadow-md hover:shadow-red-500/25 border border-red-200 dark:border-red-800'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isAdminPanel && !location.pathname.includes(item.href) ? 'text-red-500' : ''}`} />
                  {item.name}
                </NavLink>
              );
            })}
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

          <div className="flex flex-1 items-center">
            <h2 className="text-lg font-semibold text-foreground">
              {navigation.find(item => window.location.pathname.includes(item.href))?.name || 'Dashboard'}
            </h2>
          </div>
        </div>

        {/* Page content */}
        <main className="pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;