import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import PMDashboard from "./pages/PMDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import TaskHub from "./pages/TaskHub";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ClientManagement from "./pages/ClientManagement";
import ClientDetail from "./pages/ClientDetail";
import ClientsProjects from "./pages/ClientsProjects";
import AIAgents from "./pages/AIAgents";
import AITools from "./pages/AITools";
import People from "./pages/People";
import ActionsTasks from "./pages/ActionsTasks";
import AdminOverview from "./pages/admin/AdminOverview";
import BrandManagement from "./pages/admin/BrandManagement";
import UserManagement from "./pages/admin/UserManagement";
import UserDetail from "./pages/admin/UserDetail";
import IntegrationManager from "./pages/admin/IntegrationManager";
import KPIConfigurator from "./pages/admin/KPIConfigurator";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* User Role Routes */}
          <Route element={<Layout userRole="user" />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<TaskHub />} />
            <Route path="/user/reports" element={<Reports />} />
            <Route path="/user/settings" element={<Settings />} />
          </Route>
          
          {/* PM Role Routes */}
          <Route element={<Layout userRole="pm" />}>
            <Route path="/pm/dashboard" element={<PMDashboard />} />
            <Route path="/pm/tasks" element={<TaskHub />} />
            <Route path="/pm/reports" element={<Reports />} />
            <Route path="/pm/settings" element={<Settings />} />
            <Route path="/pm/clients" element={<ClientManagement />} />
            <Route path="/pm/clients/:clientId" element={<ClientDetail />} />
          </Route>
          
          {/* Manager Role Routes */}
          <Route element={<Layout userRole="manager" />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/ai-agents" element={<AIAgents />} />
            <Route path="/manager/ai-tools" element={<AITools />} />
            <Route path="/manager/clients-projects" element={<ClientsProjects />} />
            <Route path="/manager/clients" element={<ClientManagement />} />
            <Route path="/manager/clients/:clientId" element={<ClientDetail />} />
            <Route path="/manager/brands" element={<BrandManagement />} />
            <Route path="/manager/actions-tasks" element={<ActionsTasks />} />
            <Route path="/manager/people" element={<People />} />
          </Route>
          
          {/* Default Dashboard Route - redirects based on role */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskHub />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Admin Panel Routes - Super Admin Only */}
          <Route path="/adminpanel" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="brands" element={<BrandManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/:userId" element={<UserDetail />} />
            <Route path="integrations" element={<IntegrationManager />} />
            <Route path="kpis" element={<KPIConfigurator />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
