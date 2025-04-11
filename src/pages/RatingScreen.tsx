import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const RatingAspect = ({ title, rating, setRating }) => {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-700">{title}</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={`h-5 w-5 cursor-pointer ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RatingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { masseur = "Costin M. - Deep Tissue" } = location.state || {};
  const therapistName = masseur.split(' - ')[0];
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Rating aspects
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  
  const handleBack = () => {
    navigate('/tracking');
  };
  
  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitted(true);
    
    // Show confirmation message
    toast({
      title: "Thank you for your feedback!",
      description: "Your rating has been submitted successfully.",
    });
    
    // Navigate to home screen after delay
    setTimeout(() => {
      navigate('/home');
    }, 2500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-cyan-100 rounded-full p-5 mb-6"
        >
          <Star className="h-10 w-10 text-yellow-500 fill-current" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl font-semibold text-center mb-2"
        >
          Thank You For Your Feedback!
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-gray-600 text-center mb-8"
        >
          Your rating helps us improve our service.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Button onClick={() => navigate('/home')}>
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">Rate Your Experience</h1>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 p-4">
        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col items-center">
            <Avatar className="h-20 w-20 mb-4 mt-2">
              <div className="bg-cyan-100 w-full h-full rounded-full flex items-center justify-center">
                <span className="text-cyan-800 text-lg font-medium">{therapistName[0]}</span>
              </div>
            </Avatar>
            
            <h2 className="font-medium text-gray-900 text-lg mb-1">How was your session with {therapistName}?</h2>
            <p className="text-gray-600 text-center mb-6">Your feedback helps us improve our service.</p>
            
            <div className="flex space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transform transition-transform hover:scale-110"
                >
                  <Star 
                    className={`h-10 w-10 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
            </div>
            
            <div className="w-full mb-4">
              <Textarea
                placeholder={`Share your experience with ${therapistName} (optional)`}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-3">Rate Specific Aspects</h2>
          
          <RatingAspect 
            title="Professionalism"
            rating={professionalismRating}
            setRating={setProfessionalismRating}
          />
          
          <RatingAspect 
            title="Massage Quality"
            rating={qualityRating}
            setRating={setQualityRating}
          />
          
          <RatingAspect 
            title="Punctuality"
            rating={punctualityRating}
            setRating={setPunctualityRating}
          />
        </div>
      </div>
      
      <div className="p-4 bg-white border-t">
        <Button 
          onClick={handleSubmit} 
          className="w-full py-6"
        >
          Submit Rating
        </Button>
      </div>
    </div>
  );
};

export default RatingScreen;
