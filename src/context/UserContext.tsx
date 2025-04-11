import React, { createContext, useContext, useState } from 'react';

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
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: 'John Doe',
    phone: '+40 712 345 678',
    email: 'john.doe@example.com'
  });

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