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
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Update userInfo when auth user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use firstName and lastName directly from AuthContext's user object
      setUserInfo({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phoneNumber || '',
        email: user.email || ''
      });
      
      console.log('UserContext: Updated user info from auth context', { 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email 
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
  }, [user, isAuthenticated]);

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