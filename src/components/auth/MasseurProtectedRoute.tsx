import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isMasseurRegistered } from '@/services/MasseurService';

/**
 * MasseurProtectedRoute component that checks if user is an approved masseur
 * Checks the masseuses table for 'approved' status, not just user roles
 */
const MasseurProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isMasseurApproved, setIsMasseurApproved] = useState<boolean>(false);
  const [checkingMasseurStatus, setCheckingMasseurStatus] = useState<boolean>(true);

  // Check masseur approval status
  useEffect(() => {
    const checkMasseurApproval = async () => {
      if (!isAuthenticated) {
        setCheckingMasseurStatus(false);
        return;
      }

      try {
        const isApproved = await isMasseurRegistered();
        setIsMasseurApproved(isApproved);
      } catch (error) {
        console.error('Error checking masseur approval status:', error);
        setIsMasseurApproved(false);
      } finally {
        setCheckingMasseurStatus(false);
      }
    };

    if (!authLoading) {
      checkMasseurApproval();
    }
  }, [isAuthenticated, authLoading]);

  // Show loading while checking authentication or masseur status
  if (authLoading || checkingMasseurStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If not an approved masseur, redirect to unauthorized
  if (!isMasseurApproved) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If authenticated and approved masseur, render the child routes
  return <Outlet />;
};

export default MasseurProtectedRoute; 