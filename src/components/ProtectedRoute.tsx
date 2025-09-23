import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'super_admin' | 'manager' | 'pm' | 'user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredMinimumRole?: UserRole;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredMinimumRole 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Add debugging
  console.log('ProtectedRoute Debug:', {
    user: user?.role,
    requiredRole,
    requiredMinimumRole,
    path: location.pathname
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check specific role requirement
  if (requiredRole && user.role !== requiredRole) {
    console.log('Role mismatch:', user.role, 'vs required:', requiredRole);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check minimum role requirement
  if (requiredMinimumRole) {
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'pm': 2,
      'manager': 3,
      'super_admin': 4
    };

    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredMinimumRole];
    
    console.log('Role hierarchy check:', {
      userRole: user.role,
      userLevel,
      requiredRole: requiredMinimumRole,
      requiredLevel,
      hasAccess: userLevel >= requiredLevel
    });

    if (userLevel < requiredLevel) {
      console.log('Insufficient role level');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('Access granted for role:', user.role);
  return <>{children}</>;
}