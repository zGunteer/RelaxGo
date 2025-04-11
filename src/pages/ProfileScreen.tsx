import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Camera,
  UserCircle,
  Trash2
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';

const ProfileMenuItem = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center">
      <Icon className="h-5 w-5 text-gray-500 mr-3" />
      <span className="text-gray-900">{label}</span>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-400" />
  </button>
);

const ProfileScreen = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const { userInfo } = useUser();

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate('/auth');
  };

  const handleDeleteAccount = () => {
    // Add delete account confirmation here
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.success('Account deleted successfully');
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Profile Header with Photo Upload */}
      <div className="bg-white px-4 py-6">
        <div className="flex items-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-500" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-semibold text-gray-900">{userInfo.name}</h1>
            <p className="text-sm text-gray-500">{userInfo.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Menu */}
      <div className="flex-1 mt-4">
        <div className="bg-white divide-y divide-gray-100">
          <ProfileMenuItem
            icon={UserCircle}
            label="Personal Information"
            onClick={() => navigate('/profile/personal-info')}
          />
          <ProfileMenuItem
            icon={Settings}
            label="Settings"
            onClick={() => navigate('/settings')}
          />
          <ProfileMenuItem
            icon={Bell}
            label="Notifications"
            onClick={() => navigate('/notifications')}
          />
          <ProfileMenuItem
            icon={CreditCard}
            label="Payment Methods"
            onClick={() => navigate('/payment-methods')}
          />
          <ProfileMenuItem
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => navigate('/help')}
          />
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-4 bg-white text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Log Out</span>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center p-4 bg-white text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-5 w-5 mr-3" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default ProfileScreen; 