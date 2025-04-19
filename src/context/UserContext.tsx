import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}

interface UserContextType {
  userInfo: UserInfo;
  updateUserInfo: (info: UserInfo) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }) => {
  // Default initial state with empty values
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    phone: '',
    email: ''
  });

  // Get authentication info from AuthContext
  const { user, isAuthenticated } = useAuth();

  // Update userInfo when auth user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Format the name from firstName and lastName
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      
      setUserInfo({
        name: fullName,
        phone: user.phoneNumber || '',
        email: user.email || ''
      });
      
      console.log('UserContext: Updated user info from auth context', { fullName, email: user.email });
    } else {
      // Reset to default when logged out
      setUserInfo({
        name: '',
        phone: '',
        email: ''
      });
    }
  }, [user, isAuthenticated]);

  const updateUserInfo = (info: UserInfo) => {
    setUserInfo(info);
  };

  return (
    <UserContext.Provider value={{ userInfo, updateUserInfo }}>
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