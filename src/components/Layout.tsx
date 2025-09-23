import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Bot, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  X,
  BarChart3,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Task Hub", href: "/tasks", icon: Bot },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  userRole?: 'super_admin' | 'manager' | 'brand_owner' | 'contributor';
  userName?: string;
}

export default function Layout({ userRole = 'manager', userName = 'John Doe' }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Filter navigation based on user role
  const getNavigation = () => {
    const baseNav = navigation;
    
    // Add Admin Panel only for super admins
    if (userRole === 'super_admin') {
      return [
        ...baseNav,
        { name: "Admin Panel", href: "/adminpanel", icon: Shield }
      ];
    }
    
    return baseNav;
  };

  const navItems = getNavigation();

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
                <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')} Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const isAdminPanel = item.name === "Admin Panel";
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-smooth
                    ${active 
                      ? 'bg-gradient-primary text-white shadow-md' 
                      : isAdminPanel
                      ? 'text-muted-foreground hover:text-foreground hover:bg-warning/10 border border-warning/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {isAdminPanel && (
                    <div className="ml-auto">
                      <div className="h-2 w-2 bg-warning rounded-full"></div>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-primary text-white">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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
                {navItems.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h2>
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
}