import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { setMasseurRegistered } from '@/services/MasseurService';

const statusSteps = [
  {
    id: 'received',
    title: 'Application Received',
    description: 'We have received your application',
    timing: 'Just now'
  },
  {
    id: 'reviewing',
    title: 'Documents Under Review',
    description: 'Your documents are being reviewed by our team',
    timing: 'In progress'
  },
  {
    id: 'accepted',
    title: 'Application Accepted',
    description: 'Congratulations! Your application has been approved',
    timing: 'Just completed'
  }
];

const MasseurStatusScreen = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate progress of application review
    const step1Timer = setTimeout(() => {
      setCurrentStep(1);
    }, 2000);

    const step2Timer = setTimeout(() => {
      setCurrentStep(2);
      setIsComplete(true);
      
      // Set masseur as registered in local storage
      setMasseurRegistered(true);
    }, 6000);

    const redirectTimer = setTimeout(() => {
      navigate('/masseur-dashboard');
    }, 8000);

    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Application Status</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-medium text-gray-900">Your Masseur Application</h2>
              <p className="text-sm text-gray-500">
                {isComplete 
                  ? 'Your application has been approved!' 
                  : 'We are processing your application'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <div className="space-y-6">
            {statusSteps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < statusSteps.length - 1 && (
                  <div 
                    className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} 
                  />
                )}
                
                <div className="flex">
                  {/* Status Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                    index < currentStep 
                      ? 'bg-green-100' 
                      : index === currentStep 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                  }`}>
                    {index < currentStep ? (
                      <Check className={`h-4 w-4 text-green-600`} />
                    ) : index === currentStep ? (
                      currentStep === statusSteps.length - 1 ? (
                        <Check className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Status Content */}
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                    <p className={`text-xs mt-1 ${
                      index < currentStep 
                        ? 'text-green-600' 
                        : index === currentStep 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                    }`}>
                      {index < currentStep 
                        ? 'Completed' 
                        : index === currentStep 
                          ? step.timing 
                          : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasseurStatusScreen; 