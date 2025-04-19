import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed

const Index: React.FC = () => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  console.log('Index rendering - Auth state:', { isAuthenticated, authLoading, user });

  useEffect(() => {
    console.log('Index useEffect - Auth state changed:', { isAuthenticated, authLoading, user });
    
    // Wait until the authentication status is determined
    if (!authLoading) {
      if (isAuthenticated) {
        // If authenticated, go to the main home screen
        console.log('Index: User authenticated, navigating to /home');
        navigate('/home', { replace: true }); 
      } else {
        // If not authenticated, go to the authentication screen
        console.log('Index: User not authenticated, navigating to /auth');
        navigate('/auth', { replace: true });
      }
    } else {
      console.log('Index: Still loading authentication state...');
    }
  }, [isAuthenticated, authLoading, navigate, user]);

  // If still initializing after 5 seconds, force navigate to auth
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.log('Index: Auth loading timeout exceeded, forcing navigation to /auth');
        navigate('/auth', { replace: true });
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [authLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyan-50">
      <div className="text-center">
        <p className="text-xl text-cyan-700">Initializing...</p>
        {authLoading && <p className="text-sm text-cyan-500">Checking authentication status...</p>}
      </div>
    </div>
  );
};

export default Index;
