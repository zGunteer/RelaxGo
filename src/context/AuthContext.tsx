import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User, 
  LoginInput, 
  RegisterInput, 
  SocialLoginInput, 
  ProfileUpdateInput,
  UserRole
} from '../services/AuthService';

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  socialLogin: (data: SocialLoginInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateInput) => Promise<void>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  socialLogin: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  clearError: () => {}
});

// Props interface for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if the user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
    
    setLoading(false);
  }, []);
  
  // Login method - simplified to just set a dummy user
  const login = async (data: LoginInput) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a dummy user
      const dummyUser: User = {
        id: '1',
        email: data.email || 'user@example.com',
        firstName: 'Demo',
        lastName: 'User',
        role: UserRole.CLIENT,
        createdAt: new Date().toISOString()
      };
      
      // Store the user in localStorage
      localStorage.setItem('user', JSON.stringify(dummyUser));
      setUser(dummyUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register method - simplified to just set a dummy user
  const register = async (data: RegisterInput) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a dummy user from registration data
      const dummyUser: User = {
        id: '1',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.CLIENT,
        phoneNumber: data.phoneNumber,
        createdAt: new Date().toISOString()
      };
      
      // Store the user in localStorage
      localStorage.setItem('user', JSON.stringify(dummyUser));
      setUser(dummyUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Social login method - simplified
  const socialLogin = async (data: SocialLoginInput) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a dummy user for social login
      const dummyUser: User = {
        id: '1',
        email: `user_${Date.now()}@example.com`,
        firstName: 'Social',
        lastName: 'User',
        role: data.role || UserRole.CLIENT,
        createdAt: new Date().toISOString()
      };
      
      // Store the user in localStorage
      localStorage.setItem('user', JSON.stringify(dummyUser));
      setUser(dummyUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during social login');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout method
  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('user');
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update profile method - simplified
  const updateProfile = async (data: ProfileUpdateInput) => {
    try {
      setLoading(true);
      setError(null);
      
      if (user) {
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Clear any error
  const clearError = () => {
    setError(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        socialLogin,
        logout,
        updateProfile,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 