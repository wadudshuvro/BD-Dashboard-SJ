import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Shield,
  Building2,
  Users,
  Plug,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Bot,
  Target,
  ArrowLeft,
  Home,
  FileText,
  Briefcase,
  UserCheck,
  Zap,
  TrendingUp,
  Calendar,
  Crosshair,
  Megaphone,
  Bug,
  Sparkles,
  ClipboardList,
  UserPlus,
  MessageSquare,
  Package,
  ListChecks,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-sji.png";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { enabled: feedbackEnabled } = useFeatureFlag("feedback_enabled", true);

  const navigation = useMemo(() => {
    const sections = [
      {
        section: "Core Administration",
        items: [
          { name: "User Management", href: "/adminpanel/users", icon: Users },
          { name: "POD Management", href: "/adminpanel/pods", icon: UserPlus },
        ],
      },
      {
        section: "System & Operations",
        items: [
          { name: "System Settings", href: "/adminpanel/settings", icon: Settings },
          { name: "EOD Management", href: "/adminpanel/eod-management", icon: Calendar },
          { name: "Documentation", href: "/adminpanel/documentation", icon: FileText },
        ],
      },
      {
        section: "Integrations",
        items: [
          { name: "Integration Manager", href: "/adminpanel/integrations", icon: Plug },
          { name: "Control Tower", href: "/adminpanel/integrations/control-tower-sync", icon: Network },
        ],
      },
      {
        section: "AI Operations",
        items: [
          { name: "AI Agents", href: "/adminpanel/ai/agents", icon: Bot },
        ],
      },
      {
        section: "Strategy & Growth",
        items: [
          { name: "Products & Services", href: "/adminpanel/strategy/products", icon: Package },
          { name: "Target Niches", href: "/adminpanel/strategy/niches", icon: Crosshair },
          { name: "Checklist Templates", href: "/adminpanel/strategy/checklist-templates", icon: ListChecks },
        ],
      },
    ];

    if (feedbackEnabled) {
      sections.push({
        section: "Support",
        items: [
          { name: "Feedback Manager", href: "/adminpanel/feedback", icon: ClipboardList },
          { name: "Submit Feedback", href: "/feedback/submit", icon: MessageSquare },
        ],
      });
    }

    return sections;
  }, [feedbackEnabled]);

  const isActiveRoute = (href: string, exact = false) => {
    const sanitizedHref = href.split("?")[0];
    if (exact) {
      return location.pathname === sanitizedHref;
    }
    return location.pathname.startsWith(sanitizedHref);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-auto items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex flex-col items-center flex-1 gap-1">
              <img src={logo} alt="SJ Innovation" className="h-20 w-auto" />
              <p className="text-[18px] font-bold text-foreground tracking-tight">Business Dev AI</p>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-foreground">Admin Panel</span>
                <span className="text-xs text-muted-foreground">Super Admin</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden absolute top-4 right-4"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 px-4 py-6 scroll-smooth">
            {navigation.map((section) => (
              <div key={section.section}>
                <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.section}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isActiveRoute(item.href);
                    
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-sm font-medium">SA</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Super Admin</p>
                  <p className="text-xs text-muted-foreground">admin@sjinnovation.com</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-foreground">
                Admin Panel
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <NavLink to="/bd/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                BD Portal
              </NavLink>
            </Button>
            <Button variant="ghost" size="sm" title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;