import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Simplified ProtectedRoute component that doesn't check for authentication
 * It just renders its children directly
 */
const ProtectedRoute: React.FC = () => {
  // Just render the children directly with no auth checks
  return <Outlet />;
};

export default ProtectedRoute; 