import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const MasseurSignupScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    city: '',
    termsAccepted: false
  });
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    city: '',
    termsAccepted: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({ ...prev, termsAccepted: checked }));
    if (errors.termsAccepted) {
      setErrors(prev => ({ ...prev, termsAccepted: '' }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      phone: '',
      city: '',
      termsAccepted: ''
    };

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    }

    // City validation
    if (!formData.city) {
      newErrors.city = 'City is required';
      valid = false;
    }

    // Terms acceptance
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms to continue';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Navigate to the next step of the masseur signup process
      navigate('/masseur-documents', { 
        state: { 
          initialFormData: formData 
        } 
      });
    }
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
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Become a Masseur</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-medium text-gray-900">Join our masseur network</h2>
              <p className="text-sm text-gray-500">Fill out the form below to get started</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-5 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              className={`${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input
              type="tel"
              name="phone"
              placeholder="+40 712 345 678"
              value={formData.phone}
              onChange={handleInputChange}
              className={`${errors.phone ? 'border-red-500' : ''}`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input
              type="text"
              name="city"
              placeholder="Bucharest"
              value={formData.city}
              onChange={handleInputChange}
              className={`${errors.city ? 'border-red-500' : ''}`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox 
                id="terms" 
                checked={formData.termsAccepted}
                onCheckedChange={handleCheckboxChange}
                className={`${errors.termsAccepted ? 'border-red-500' : ''}`}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-700">
                I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </label>
              {errors.termsAccepted && (
                <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MasseurSignupScreen; 