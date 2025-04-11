import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Check, Loader2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';

const PaymentProcessStep = ({ title, description, icon: Icon, status }) => (
  <div className="flex items-start">
    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
      status === 'complete' 
        ? 'bg-green-100' 
        : status === 'current' 
          ? 'bg-blue-100'
          : 'bg-gray-100'
    }`}>
      {status === 'complete' ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : status === 'current' ? (
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      ) : (
        <Icon className="h-5 w-5 text-gray-500" />
      )}
    </div>
    <div className="ml-3">
      <h3 className={`font-medium ${
        status === 'complete' 
          ? 'text-green-600' 
          : status === 'current' 
            ? 'text-blue-600'
            : 'text-gray-500'
      }`}>
        {title}
      </h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const PaymentScreen = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Simulate payment processing
  useEffect(() => {
    const steps = [
      { delay: 1000, message: 'Validating payment information...' },
      { delay: 2000, message: 'Authorizing payment...' },
      { delay: 1500, message: 'Processing payment...' },
      { delay: 1000, message: 'Payment successful! Redirecting...' }
    ];

    let timer = null;
    
    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Wait for the specified delay
        await new Promise(resolve => {
          timer = setTimeout(() => {
            toast.info(step.message);
            setCurrentStep(i + 1);
            resolve(null);
          }, step.delay);
        });
      }
      
      // After all steps are complete
      setIsComplete(true);
      
      // Navigate to tracking after a short delay
      timer = setTimeout(() => {
        navigate('/tracking');
      }, 1500);
    };
    
    runSteps();
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [navigate]);
  
  const paymentSteps = [
    {
      title: 'Validating Information',
      description: 'Verifying your payment details',
      icon: CreditCard,
    },
    {
      title: 'Authorization',
      description: 'Authorizing payment with your bank',
      icon: CreditCard,
    },
    {
      title: 'Processing',
      description: 'Processing your payment',
      icon: CreditCard,
    },
    {
      title: 'Confirmation',
      description: 'Your payment is confirmed',
      icon: CreditCard,
    }
  ];
  
  const getStepStatus = (index) => {
    if (currentStep > index) return 'complete';
    if (currentStep === index) return 'current';
    return 'pending';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Payment Processing</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
          <div className="text-center mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {isComplete ? 'Payment Complete!' : 'Processing Your Payment'}
            </h2>
            <p className="text-gray-500">
              {isComplete 
                ? 'Your booking has been confirmed' 
                : 'Please wait while we process your payment'}
            </p>
          </div>
          
          <div className="space-y-6">
            {paymentSteps.map((step, index) => (
              <PaymentProcessStep
                key={index}
                title={step.title}
                description={step.description}
                icon={step.icon}
                status={getStepStatus(index)}
              />
            ))}
          </div>
          
          {isComplete && (
            <div className="mt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Redirecting to your booking details...</p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Massage Service</span>
              <span className="text-gray-900">$95.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Fee</span>
              <span className="text-gray-900">$3.00</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-medium text-gray-900">$98.00</span>
            </div>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default PaymentScreen;
