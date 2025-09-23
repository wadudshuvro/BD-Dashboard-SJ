import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import PMDashboard from "./pages/PMDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import TaskHub from "./pages/TaskHub";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
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
import UserBrands from "./pages/UserBrands";

const queryClient = new QueryClient();

// Smart redirect component based on user role
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/adminpanel" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'pm':
      return <Navigate to="/pm/dashboard" replace />;
    case 'user':
      return <Navigate to="/user/dashboard" replace />;
    default:
      return <Navigate to="/user/dashboard" replace />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* User Role Routes */}
            <Route path="/user/*" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout userRole="user" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="tasks" element={<TaskHub />} />
              <Route path="reports" element={<Reports />} />
              <Route path="ai-tools" element={<AITools />} />
              <Route path="ai-agents" element={<AIAgents />} />
              <Route path="people" element={<People />} />
              <Route path="brands" element={<UserBrands />} />
            </Route>
            
            {/* PM Role Routes */}
            <Route path="/pm/*" element={
              <ProtectedRoute requiredMinimumRole="pm">
                <Layout userRole="pm" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<PMDashboard />} />
              <Route path="tasks" element={<TaskHub />} />
              <Route path="reports" element={<Reports />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
            </Route>
            
            {/* Manager Role Routes */}
            <Route path="/manager/*" element={
              <ProtectedRoute requiredMinimumRole="manager">
                <Layout userRole="manager" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="ai-agents" element={<AIAgents />} />
              <Route path="ai-tools" element={<AITools />} />
              <Route path="clients-projects" element={<ClientsProjects />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="actions-tasks" element={<ActionsTasks />} />
              <Route path="people" element={<People />} />
            </Route>
            
            {/* Admin Panel Routes - Super Admin Only */}
            <Route path="/adminpanel/*" element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminOverview />} />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId" element={<UserDetail />} />
              <Route path="integrations" element={<IntegrationManager />} />
              <Route path="kpis" element={<KPIConfigurator />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            {/* Legacy/Fallback Routes */}
            <Route element={<Layout />}>
              <Route path="tasks" element={<TaskHub />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
