import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const PersonalInfoScreen = () => {
  const navigate = useNavigate();
  const { userInfo, updateUserInfo } = useUser();
  const { updateProfile, user } = useAuth();
  const [formData, setFormData] = useState(userInfo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(userInfo);
  }, [userInfo]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // First, extract first name and last name from the full name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Update Supabase via AuthContext
      await updateProfile({
        firstName,
        lastName,
        phoneNumber: formData.phone
        // Note: Email updates might require additional steps via Auth API
      });
      
      // Update local state via UserContext
      updateUserInfo(formData);
      
      toast.success('Personal information updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Personal Information</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`ml-auto ${loading ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'}`}
        >
          <Save className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">First and last name</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={true} // Email updates require additional auth steps, so disable for now
            />
            <p className="mt-1 text-xs text-gray-500">Email address cannot be changed directly</p>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default PersonalInfoScreen; 