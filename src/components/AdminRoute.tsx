import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import SplashScreen from '../pages/SplashScreen'; // Changed to default import

const AdminRoute = () => {
  const { isAdmin, loading, session } = useAuth();

  if (loading) {
    // Show a loading indicator while auth state is being determined
    // You might want to use a more sophisticated loading component
    return <SplashScreen />; 
  }

  if (!session) {
     // If there's no session (not logged in), redirect to login/auth page
     return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    // If logged in but not an admin, redirect to an unauthorized page or home
    console.warn('AdminRoute: User is not authorized for this route.');
    return <Navigate to="/unauthorized" replace />;
  }

  // If logged in and is admin, render the child route component
  return <Outlet />; // Renders the nested route (e.g., AdminPanelScreen)
};

export default AdminRoute; 