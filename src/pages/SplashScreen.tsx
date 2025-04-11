import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { updateLastActiveTimestamp } from '@/services/AppStateService';

const SplashScreen = () => {
  const navigate = useNavigate();
  
  // Handle navigation after splash screen
  useEffect(() => {
    // Update the last active timestamp on app startup
    updateLastActiveTimestamp();
    
    // Navigate to auth screen after a short delay
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-blue-600 mb-4">RelaxGo</h1>
        <p className="text-xl text-blue-500">Your massage app</p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
