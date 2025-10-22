import React, { lazy } from "react";
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
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ClientManagement from "@/pages/ClientManagement";
import ClientDetail from "@/pages/ClientDetail";
import HubSpotImport from "@/pages/HubSpotImport";
import ProjectManagement from "@/pages/ProjectManagement";
import ProjectDetail from "@/pages/ProjectDetail";
import ClientsProjects from "./pages/ClientsProjects";
import People from "./pages/People";
import ActionsTasks from "./pages/ActionsTasks";
import EODSubmission from "./pages/EODSubmission";
import MyEODSubmissions from "./pages/MyEODSubmissions";
import UserManagement from "./pages/admin/UserManagement";
import BrandManagement from "./pages/admin/BrandManagement";
import BrandDetail from "./pages/admin/BrandDetail";
import IntegrationManager from "./pages/admin/IntegrationManager";
import LinkedInAgentConfig from "./pages/admin/LinkedInAgentConfig";
import AdminSettings from "./pages/admin/AdminSettings";
import EODManagement from "./pages/admin/EODManagement";
import UserDetail from "./pages/admin/UserDetail";
import AdminPanel from "./pages/admin/AdminPanel";
import UserBrands from "./pages/UserBrands";
import AIAgentsPage from "./pages/ai-agents";
import MyAgentsPage from "./pages/my-agents";
import PeopleReviewDashboard from "./pages/PeopleReviewDashboard";
import MyDashboard from "./pages/MyDashboard";
import UserProfile from "./pages/UserProfile";
import NicheManagement from "./pages/bd/NicheManagement";
import CampaignManagement from "./pages/bd/CampaignManagement";
import CampaignDetail from "./pages/bd/CampaignDetail";
import PODManagement from "./pages/admin/PODManagement";
import Prospecting from "./pages/bd/pipeline/Prospecting";
import Qualification from "./pages/bd/pipeline/Qualification";
import Proposal from "./pages/bd/pipeline/Proposal";
import Negotiation from "./pages/bd/pipeline/Negotiation";
import Clients from "./pages/bd/pipeline/Clients";
import BDDashboard from "./pages/bd/Dashboard";
import ProductManagement from "./pages/bd/ProductManagement";
import Scoreboard from "./pages/bd/Scoreboard";
import FollowUps from "./pages/bd/FollowUps";
import UserSettings from "./pages/bd/UserSettings";

import AIDashboard from "./pages/ai-dashboard";
import LeadAutomationPage from "./pages/automation/LeadAutomationPage";
import AutomationSettings from "./pages/admin/AutomationSettings";

const queryClient = new QueryClient();

// Lazy load Documentation
const Documentation = lazy(() => import("./pages/admin/Documentation"));
const FeedbackSubmitPage = lazy(() => import("./pages/feedback/SubmitFeedback"));
const AdminFeedbackManager = lazy(() => import("./pages/admin/FeedbackManager"));

// Smart redirect component based on user role
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/dashboard" replace />; // Super admin gets own dashboard
    case 'manager':
    case 'brand_manager':
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
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* Global User Profile Route */}
            <Route path="/my-profile" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout userRole="user" />
              </ProtectedRoute>
            }>
              <Route index element={<UserProfile />} />
            </Route>
            
            {/* User Role Routes */}
            <Route path="/user/*" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout userRole="user" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="people/my-dashboard" element={<React.Suspense fallback={<div>Loading...</div>}><MyDashboard /></React.Suspense>} />
              <Route path="brands" element={<UserBrands />} />
              <Route path="brands/:brandId" element={<BrandDetail />} />
              <Route path="my-agents" element={<MyAgentsPage />} />
              <Route path="hubspot-import" element={<HubSpotImport />} />
            </Route>
            
            {/* PM Role Routes */}
            <Route path="/pm/*" element={
              <ProtectedRoute requiredMinimumRole="pm">
                <Layout userRole="pm" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<PMDashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
              <Route path="hubspot-import" element={<HubSpotImport />} />
              <Route path="projects" element={<ProjectManagement />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="tasks" element={<ActionsTasks />} />
              <Route path="eod-submission" element={<EODSubmission />} />
              <Route path="my-agents" element={<MyAgentsPage />} />
            </Route>
            
            {/* Super Admin Dashboard Routes */}
            <Route path="/dashboard/*" element={
              <ProtectedRoute requiredRole="super_admin">
                <Layout userRole="super_admin" />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="clients-projects" element={<ClientsProjects />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
              <Route path="hubspot-import" element={<HubSpotImport />} />
              <Route path="projects" element={<ProjectManagement />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="brands/:brandId" element={<BrandDetail />} />
              <Route path="actions-tasks" element={<ActionsTasks />} />
              <Route path="eod-submission" element={<EODSubmission />} />
              <Route path="my-eod-submissions" element={<MyEODSubmissions />} />
              <Route path="my-agents" element={<MyAgentsPage />} />
            </Route>

            {/* Manager Role Routes */}
            <Route path="/manager/*" element={
              <ProtectedRoute requiredRole="manager">
                <Layout userRole="manager" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="clients-projects" element={<ClientsProjects />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
              <Route path="hubspot-import" element={<HubSpotImport />} />
              <Route path="projects" element={<ProjectManagement />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="brands/:brandId" element={<BrandDetail />} />
              <Route path="actions-tasks" element={<ActionsTasks />} />
              <Route path="eod-submission" element={<EODSubmission />} />
              <Route path="my-eod-submissions" element={<MyEODSubmissions />} />
              <Route path="my-agents" element={<MyAgentsPage />} />
              {/* Admin-specific routes accessible from manager interface */}
              <Route path="admin/users" element={<UserManagement />} />
              <Route path="admin/users/:userId" element={<UserDetail />} />
              <Route path="admin/integrations" element={<IntegrationManager />} />
              <Route path="admin/settings" element={<AdminSettings />} />
            </Route>
            
            {/* Admin Panel Routes - Super Admin Only */}
            <Route path="/adminpanel/*" element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminPanel />} />
              <Route
                path="feedback"
                element={<React.Suspense fallback={<div>Loading...</div>}><AdminFeedbackManager /></React.Suspense>}
              />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="brands/:brandId" element={<BrandDetail />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId" element={<UserDetail />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
              <Route path="hubspot-import" element={<HubSpotImport />} />
              <Route path="projects" element={<ProjectManagement />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="integrations" element={<IntegrationManager />} />
              <Route path="linkedin-agents" element={<LinkedInAgentConfig />} />
              <Route path="documentation" element={<React.Suspense fallback={<div>Loading...</div>}><Documentation /></React.Suspense>} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="settings/automation" element={<AutomationSettings />} />
              <Route path="eod-management" element={<EODManagement />} />
              <Route path="people" element={<People />} />
              <Route path="people/review" element={<React.Suspense fallback={<div>Loading...</div>}><PeopleReviewDashboard /></React.Suspense>} />
              <Route path="ai-agents" element={<AIAgentsPage />} />
              <Route path="ai-dashboard" element={<AIDashboard />} />
              <Route path="pods" element={<PODManagement />} />
            </Route>

            {/* Feedback Module */}
            <Route path="/feedback/*" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route
                path="submit"
                element={<React.Suspense fallback={<div>Loading...</div>}><FeedbackSubmitPage /></React.Suspense>}
              />
            </Route>

            {/* BD Portal Routes - Available to all users */}
            <Route path="/bd/*" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/bd/dashboard" replace />} />
              <Route path="dashboard" element={<BDDashboard />} />
              
              {/* My Agents */}
              <Route path="my-agents" element={<MyAgentsPage />} />
              
              {/* Pipeline - Read-only from Control Tower */}
              <Route path="pipeline/prospecting" element={<Prospecting />} />
              <Route path="pipeline/qualification" element={<Qualification />} />
              <Route path="pipeline/proposal" element={<Proposal />} />
              <Route path="pipeline/negotiation" element={<Negotiation />} />
              <Route path="pipeline/clients" element={<Clients />} />
              
              {/* Strategy - CRUD */}
              <Route path="strategy/products" element={<ProductManagement />} />
              <Route path="strategy/niches" element={<NicheManagement />} />
              <Route path="strategy/campaigns" element={<CampaignManagement />} />
              <Route path="strategy/campaigns/:campaignId" element={<CampaignDetail />} />
              
              {/* Performance */}
              <Route path="performance/scoreboard" element={<Scoreboard />} />
              <Route path="performance/followups" element={<FollowUps />} />
              <Route path="performance/reports" element={<Reports />} />
              
              {/* Actions */}
              <Route path="actions/tasks" element={<ActionsTasks />} />
              <Route path="actions/eod" element={<EODSubmission />} />
              <Route path="actions/eod-history" element={<MyEODSubmissions />} />
              
              {/* Admin */}
              <Route path="admin/documentation" element={<React.Suspense fallback={<div>Loading...</div>}><Documentation /></React.Suspense>} />
              <Route path="admin/settings" element={<UserSettings />} />
            </Route>

            <Route path="/automation/*" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="leads" element={<LeadAutomationPage />} />
            </Route>
            
            {/* Legacy/Fallback Routes */}
            <Route element={<Layout />}>
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
