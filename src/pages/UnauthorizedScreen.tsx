import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const UnauthorizedScreen = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/home');
  };

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