import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole, hasAnyRole, hasRole } from '@/services/AuthService';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireAllRoles?: boolean; // If true, user must have ALL roles; if false, user needs ANY role
}

/**
 * ProtectedRoute component that checks for authentication and role-based access
 * Supports multiple roles per user
 * Redirects unauthenticated users to the login page
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requireAllRoles = false }) => {
  const { userProfile, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login with the current location
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the user has the required roles
  if (allowedRoles && userProfile) {
    const userRoles = userProfile.roles || (userProfile.role ? [userProfile.role] : ['client']);
    
    let hasAccess = false;
    
    if (requireAllRoles) {
      // User must have ALL specified roles
      hasAccess = allowedRoles.every(role => hasRole(userRoles, role));
    } else {
      // User must have ANY of the specified roles
      hasAccess = hasAnyRole(userRoles, allowedRoles);
    }

    if (!hasAccess) {
      // Redirect to an unauthorized page
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // If authenticated and has the correct role(s), render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 