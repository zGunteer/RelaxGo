import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface UserInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface UserContextType {
  userInfo: UserInfo;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }) => {
  // Default initial state with empty values
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // Get authentication info from AuthContext
  const { authUser, userProfile, isAuthenticated, loading: authLoading } = useAuth();

  // Update userInfo when auth user changes
  useEffect(() => {
    if (isAuthenticated && authUser && userProfile) {
      // Use firstName and lastName from userProfile (database) instead of authUser
      setUserInfo({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        phone: authUser.phone || '',
        email: authUser.email || ''
      });
      
      console.log('UserContext: Updated user info from auth context', { 
        firstName: userProfile.first_name, 
        lastName: userProfile.last_name, 
        email: authUser.email 
      });
    } else {
      // Reset to default when logged out
      setUserInfo({
        firstName: '',
        lastName: '',
        phone: '',
        email: ''
      });
    }
  }, [authUser, userProfile, isAuthenticated]);

  // Allow updating with partial info
  const updateUserInfo = (info: Partial<UserInfo>) => {
    setUserInfo(prev => ({ ...prev, ...info }));
  };

  return (
    <UserContext.Provider value={{ userInfo, updateUserInfo, loading: authLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 