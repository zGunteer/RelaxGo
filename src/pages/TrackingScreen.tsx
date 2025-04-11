import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Phone, MessageSquare, Star, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Costin has been assigned to your booking",
  "Costin is preparing for your session",
  "Costin is on the way to your location",
  "Costin is arriving in 5 minutes",
];

const TrackingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { masseur = "Costin M. - Deep Tissue" } = location.state || {};
  const therapistName = masseur.split(' - ')[0];
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(20);
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const handleBack = () => {
    navigate('/payment');
  };
  
  const handleComplete = () => {
    navigate('/rating', { state: { masseur } });
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress > 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
      
      setEta(prev => {
        if (prev > 0) return prev - 0.3;
        return 0;
      });
      
      if (progress > 25 && currentMessage === 0) {
        setCurrentMessage(1);
      } else if (progress > 50 && currentMessage === 1) {
        setCurrentMessage(2);
      } else if (progress > 75 && currentMessage === 2) {
        setCurrentMessage(3);
      }
      
      if (progress >= 100) {
        setTimeout(() => {
          navigate('/rating', { state: { masseur } });
        }, 1500);
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, [progress, currentMessage, navigate, masseur]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">Track Your Massage</h1>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 p-4">
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Avatar className="h-14 w-14 mr-3">
                  <div className="bg-cyan-100 w-full h-full rounded-full flex items-center justify-center">
                    <span className="text-cyan-800 text-lg font-medium">{therapistName[0]}</span>
                  </div>
                </Avatar>
                
                <div>
                  <h2 className="font-medium text-gray-900">{therapistName}</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>4.9</span>
                    <span className="mx-2">•</span>
                    <span>Deep Tissue Specialist</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <MessageSquare className="h-5 w-5 text-cyan-600" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <Phone className="h-5 w-5 text-cyan-600" />
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-gray-600">En route to your location</span>
                <span className="font-medium text-cyan-600">{Math.round(eta)} min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-cyan-100 rounded-full p-2 mr-3">
                <Clock className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <h3 className="font-medium">Expected arrival</h3>
                <p className="text-sm text-gray-500">Today at 2:45 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-cyan-100 rounded-full p-2 mr-3">
                <MapPin className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <h3 className="font-medium">Your location</h3>
                <p className="text-sm text-gray-500">123 Home Address, Apt 4B</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-5">
          <h2 className="text-lg font-medium mb-3">Status Updates</h2>
          
          <div className="space-y-3">
            <AnimatePresence>
              {messages.slice(0, currentMessage + 1).map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-start"
                >
                  <div className="bg-cyan-100 rounded-full p-1 mr-3 mt-1">
                    <Check className="h-4 w-4 text-cyan-700" />
                  </div>
                  <div>
                    <p className="text-gray-700">{message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Booking Details</h2>
          
          <Card className="mb-3">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">Deep Tissue Massage</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">60 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-bold">$90.00</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-4"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your massage therapist has arrived!</h2>
            <p className="text-gray-600 mb-4">Enjoy your relaxing session.</p>
            <Button onClick={handleComplete}>Complete Session</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Check = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default TrackingScreen;
