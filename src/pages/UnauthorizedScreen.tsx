import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Home, User, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { isMasseurRegistered } from '@/services/MasseurService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const UnauthorizedScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser } = useAuth();
  const [isMasseurAttempt, setIsMasseurAttempt] = useState(false);
  const [masseurStatus, setMasseurStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if this is a masseur-related access attempt
  useEffect(() => {
    const checkMasseurAccess = async () => {
      const fromPath = location.state?.from?.pathname;
      const isMasseurRoute = fromPath?.includes('/masseur');
      
      setIsMasseurAttempt(isMasseurRoute || false);
      
      if (isMasseurRoute && authUser) {
        try {
          // Check if user has a masseur application
          const { data, error } = await supabase
            .from('masseuses')
            .select('status')
            .eq('masseuse_id', authUser.id)
            .single();

          if (!error && data) {
            setMasseurStatus(data.status);
          }
        } catch (err) {
          console.error('Error checking masseur status:', err);
        }
      }
      
      setCheckingStatus(false);
    };

    checkMasseurAccess();
  }, [location, authUser]);

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleApplyMasseur = () => {
    navigate('/masseur-signup');
  };

  const handleCheckStatus = () => {
    navigate('/masseur-status');
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full flex flex-col items-center text-center"
      >
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Access Denied
        </h1>
        
        {isMasseurAttempt ? (
          <>
            <p className="text-gray-600 mb-8">
              {masseurStatus === 'pending' 
                ? "Your masseur application is still under review. Please wait for admin approval."
                : masseurStatus === 'rejected'
                ? "Your masseur application was rejected. You can submit a new application."
                : masseurStatus === 'approved'
                ? "There was an error verifying your masseur status. Please try again."
                : "You need to be an approved masseur to access this page."
              }
            </p>
            
            <div className="space-y-3 w-full max-w-xs mb-6">
              {masseurStatus === 'pending' && (
                <Button 
                  onClick={handleCheckStatus}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3"
                >
                  <User className="mr-2 h-5 w-5" />
                  Check Application Status
                </Button>
              )}
              
              {(masseurStatus === 'rejected' || !masseurStatus) && (
                <Button 
                  onClick={handleApplyMasseur}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  <Briefcase className="mr-2 h-5 w-5" />
                  Apply to Become a Masseur
                </Button>
              )}
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="w-full py-3"
              >
                <Home className="mr-2 h-5 w-5" />
                Go to Home
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-8">
              You don't have permission to access this page. Please contact support if you believe this is an error.
            </p>
            
            <Button 
              onClick={handleGoHome}
              className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white py-6 mb-4"
            >
              <Home className="mr-2 h-5 w-5" />
              Go to Home
            </Button>
          </>
        )}
        
        <p className="text-sm text-gray-500 mt-8">
          Need help? Contact our support team at{' '}
          <a href="mailto:support@relaxgo.com" className="text-blue-600 hover:underline">
            support@relaxgo.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default UnauthorizedScreen; 