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
  Shield,
  Sparkles,
  History,
  Calendar,
  Crosshair,
  Megaphone,
  UserPlus,
  TrendingUp,
  Package,
  Trophy,
  FileDown,
  FileText,
  UserSearch,
  ClipboardCheck,
  Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import logo from "@/assets/logo-sji.png";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { FeedbackWidget } from "@/features/feedback/components/FeedbackWidget";

interface LayoutProps {
  userRole?: 'super_admin' | 'manager' | 'pm' | 'user';
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  current: boolean;
  isHeader?: boolean;
  isAdmin?: boolean;
  subItems?: NavigationItem[];
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

  // Get navigation based on role - simplified for BD-focused dashboard
  const getNavigation = (role: string): NavigationItem[] => {
    const navigation: NavigationItem[] = [
      { name: "BD Dashboard", href: "/bd/dashboard", icon: LayoutDashboard, current: false },
      { name: "My Agents", href: "/bd/my-agents", icon: Zap, current: false },
      {
        name: "Pipeline",
        href: "/bd/pipeline/prospecting",
        icon: Target,
        current: false,
        subItems: [
          { name: "Prospecting", href: "/bd/pipeline/prospecting", icon: UserSearch, current: false },
          { name: "Qualification", href: "/bd/pipeline/qualification", icon: ClipboardCheck, current: false },
          { name: "Proposal", href: "/bd/pipeline/proposal", icon: FileText, current: false },
          { name: "Negotiation", href: "/bd/pipeline/negotiation", icon: Handshake, current: false },
          { name: "Clients", href: "/bd/pipeline/clients", icon: Building2, current: false },
        ]
      },
      {
        name: "Strategy",
        href: "/bd/strategy/products",
        icon: Crosshair,
        current: false,
        subItems: [
          { name: "Products & Services", href: "/bd/strategy/products", icon: Package, current: false },
          { name: "Target Niches", href: "/bd/strategy/niches", icon: Crosshair, current: false },
          { name: "BD Campaigns", href: "/bd/strategy/campaigns", icon: Megaphone, current: false },
        ]
      },
      { 
        name: "Performance", 
        href: "/bd/performance/personal", 
        icon: BarChart3, 
        current: false,
        subItems: [
          { name: "My Performance", href: "/bd/performance/personal", icon: TrendingUp, current: false },
          { name: "Meetings & Follow-Ups", href: "/bd/performance/followups", icon: Calendar, current: false },
          { name: "Reports & Exports", href: "/bd/performance/reports", icon: FileDown, current: false },
        ]
      },
      { 
        name: "Actions", 
        href: "/bd/actions/tasks", 
        icon: CheckSquare, 
        current: false,
        subItems: [
          { name: "My Tasks", href: "/bd/actions/tasks", icon: CheckSquare, current: false },
          { name: "Submit EOD", href: "/bd/actions/eod", icon: Calendar, current: false },
          { name: "My EOD History", href: "/bd/actions/eod-history", icon: History, current: false },
        ]
      },
      { name: "SEPARATOR", href: "", icon: null, current: false, isHeader: true },
      { name: "Settings", href: "/bd/admin/settings", icon: Settings, current: false },
    ];

    // Add admin panel for super_admin only
    if (role === 'super_admin') {
      navigation.push(
        { name: "SEPARATOR", href: "", icon: null, current: false, isHeader: true },
        { name: "Admin Panel", href: "/adminpanel", icon: Shield, current: false, isAdmin: true }
      );
    }

    return navigation;
      
  };

  const { enabled: feedbackEnabled } = useFeatureFlag("feedback_enabled");
  const { enabled: feedbackWidgetEnabled } = useFeatureFlag("feedback_widget");

  const navigation = getNavigation(currentRole);

  if (feedbackEnabled) {
    navigation.push({
      name: "Support",
      href: "/feedback",
      icon: Wrench,
      current: false,
      subItems: [
        { name: "Submit Bug", href: "/feedback/submit?type=bug", icon: Wrench, current: false },
        { name: "Submit Feature", href: "/feedback/submit?type=feature", icon: Sparkles, current: false },
      ],
    });
  }

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
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-2">
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
              
              // Handle items with sub-navigation
              if (item.subItems && item.subItems.length > 0) {
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.name}
                    </div>
                    {item.subItems.map((subItem) => {
                      const sanitizedHref = subItem.href.split("?")[0];
                      const isSubActive = location.pathname === sanitizedHref;
                      return (
                        <NavLink
                          key={subItem.name}
                          to={subItem.href}
                          className={`
                            flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-smooth
                            ${isSubActive 
                              ? 'bg-gradient-primary text-white shadow-md'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            }
                          `}
                        >
                          <subItem.icon className="mr-3 h-4 w-4" />
                          {subItem.name}
                        </NavLink>
                      );
                    })}
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

          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SJ BD AI
            </h1>
            <h2 className="text-sm text-muted-foreground">
              {(() => {
                const currentItem = navigation.find(item => 
                  item.href && item.href !== "" && location.pathname.startsWith(item.href) && item.name !== "SEPARATOR"
                );
                const currentSubItem = navigation
                  .flatMap(item => item.subItems || [])
                  .find(subItem => location.pathname === subItem.href.split("?")[0]);
                
                return currentSubItem?.name || currentItem?.name || 'Dashboard';
              })()}
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

      {feedbackEnabled && feedbackWidgetEnabled ? <FeedbackWidget /> : null}
    </div>
  );
};

export default Layout;