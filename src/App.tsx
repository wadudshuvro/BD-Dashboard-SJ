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
import PersonalDashboard from "./pages/PersonalDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ActionsTasks from "./pages/ActionsTasks";
import EODSubmission from "./pages/EODSubmission";
import MyEODSubmissions from "./pages/MyEODSubmissions";
import UserManagement from "./pages/admin/UserManagement";
import IntegrationManager from "./pages/admin/IntegrationManager";
import PerplexityIntegration from "./pages/admin/PerplexityIntegration";
import AdminSettings from "./pages/admin/AdminSettings";
import EODManagement from "./pages/admin/EODManagement";
import UserDetail from "./pages/admin/UserDetail";
import AdminPanel from "./pages/admin/AdminPanel";
import MyAgentsPage from "./pages/my-agents";
import UserProfile from "./pages/UserProfile";
import NicheManagement from "./pages/bd/NicheManagement";
import CampaignManagement from "./pages/bd/CampaignManagement";
import CampaignDetail from "./pages/bd/CampaignDetail";
import CampaignContactDetail from "./pages/bd/CampaignContactDetail";
import CompanyDetail from "./pages/bd/CompanyDetail";
import PODManagement from "./pages/admin/PODManagement";
import DataSyncSettings from "./pages/admin/DataSyncSettings";
import Prospecting from "./pages/bd/pipeline/Prospecting";
import Qualification from "./pages/bd/pipeline/Qualification";
import Proposal from "./pages/bd/pipeline/Proposal";
import Negotiation from "./pages/bd/pipeline/Negotiation";
import Clients from "./pages/bd/pipeline/Clients";
import BDDashboard from "./pages/bd/Dashboard";
import ProductManagement from "./pages/bd/ProductManagement";
import FollowUps from "./pages/bd/FollowUps";
import UserSettings from "./pages/bd/UserSettings";
import AutomationSettings from "./pages/admin/AutomationSettings";
import LinkedInAgentConfig from "./pages/admin/LinkedInAgentConfig";
import DealDetail from "./pages/bd/DealDetail";
import DealFiles from "./pages/bd/DealFiles";
import ClientDetail from "./pages/bd/ClientDetail";
import ChecklistTemplateManager from "./pages/admin/ChecklistTemplateManager";
import ControlTowerSyncDashboard from "./pages/admin/ControlTowerSyncDashboard";
import LeadDetail from "./pages/bd/LeadDetail";

const queryClient = new QueryClient();

// Lazy load Documentation
const Documentation = lazy(() => import("./pages/admin/Documentation"));
const FeedbackSubmitPage = lazy(() => import("./pages/feedback/SubmitFeedback"));
const AdminFeedbackManager = lazy(() => import("./pages/admin/FeedbackManager"));

// Smart redirect component - send everyone to BD Dashboard
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // All users go to BD Dashboard as main entry point
  return <Navigate to="/bd/dashboard" replace />;
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
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<UserProfile />} />
            </Route>
            
            {/* Personal Performance Dashboard */}
            <Route path="/my-performance" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<PersonalDashboard />} />
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
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId" element={<UserDetail />} />
              <Route path="integrations" element={<IntegrationManager />} />
              <Route path="integrations/control-tower-sync" element={<ControlTowerSyncDashboard />} />
              <Route path="documentation" element={<React.Suspense fallback={<div>Loading...</div>}><Documentation /></React.Suspense>} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="eod-management" element={<EODManagement />} />
              <Route path="pods" element={<PODManagement />} />
              <Route path="ai/agents" element={<LinkedInAgentConfig />} />
              <Route path="data-sync" element={<DataSyncSettings />} />
              <Route path="strategy/products" element={<ProductManagement />} />
              <Route path="strategy/niches" element={<NicheManagement />} />
              <Route path="strategy/checklist-templates" element={<ChecklistTemplateManager />} />
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
              
              {/* Redirect old campaign URLs */}
              <Route path="strategy/campaigns" element={<Navigate to="/campaigns" replace />} />
              <Route path="strategy/campaigns/:campaignId" element={<Navigate to="/campaigns" replace />} />
              
              {/* Performance */}
              <Route path="performance/personal" element={<PersonalDashboard />} />
              
              {/* Actions */}
              <Route path="actions/tasks" element={<ActionsTasks />} />
              <Route path="actions/eod" element={<EODSubmission />} />
              <Route path="actions/eod-history" element={<MyEODSubmissions />} />
              
              {/* Admin */}
              <Route path="admin/documentation" element={<React.Suspense fallback={<div>Loading...</div>}><Documentation /></React.Suspense>} />
              <Route path="admin/settings" element={<UserSettings />} />
            </Route>

            {/* Pipeline routes - now at root level */}
            <Route path="/prospecting" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Prospecting />} />
            </Route>

            <Route path="/qualification" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Qualification />} />
            </Route>

            <Route path="/proposal" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Proposal />} />
            </Route>

            <Route path="/negotiation" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Negotiation />} />
            </Route>

            <Route path="/clients" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Clients />} />
            </Route>

<Route path="/clients/:slug" element={
  <ProtectedRoute requiredMinimumRole="user">
    <Layout />
  </ProtectedRoute>
}>
  <Route index element={<ClientDetail />} />
</Route>

{/* Follow-Ups Route */}
<Route path="/follow-ups" element={
  <ProtectedRoute requiredMinimumRole="user">
    <Layout />
  </ProtectedRoute>
}>
  <Route index element={<FollowUps />} />
</Route>

<Route path="/leads/:slug" element={
  <ProtectedRoute requiredMinimumRole="user">
    <Layout />
  </ProtectedRoute>
}>
  <Route index element={<LeadDetail />} />
</Route>
            
            <Route
              path="/:stage/:slug"
              element={
                <ProtectedRoute requiredMinimumRole="user">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DealDetail />} />
              <Route path="files" element={<DealFiles />} />
            </Route>

            {/* Campaigns at root level */}
            <Route path="/campaigns" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<CampaignManagement />} />
              <Route path=":slug" element={<CampaignDetail />} />
              <Route path=":campaignSlug/contacts/:contactSlug" element={<CampaignContactDetail />} />
            </Route>

            {/* Companies */}
            <Route path="/companies/:slug" element={
              <ProtectedRoute requiredMinimumRole="user">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<CompanyDetail />} />
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
