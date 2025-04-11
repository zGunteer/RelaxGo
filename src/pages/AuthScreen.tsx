import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Facebook, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoginInput, RegisterInput, SocialProvider, UserRole } from '@/services/AuthService';

const AuthScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, register, socialLogin, loading } = useAuth();
  
  // Get the return URL from location state or default to home
  const from = (location.state as any)?.from || '/home';
  
  // Login form state - simplified
  const [loginData, setLoginData] = useState<LoginInput>({
    email: 'demo@example.com',
    password: 'password'
  });
  
  // Register form state - simplified
  const [registerData, setRegisterData] = useState<RegisterInput>({
    email: 'demo@example.com',
    password: 'password',
    firstName: 'Demo',
    lastName: 'User',
    phoneNumber: '555-1234',
    role: UserRole.CLIENT
  });
  
  // Handle login form change
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle register form change
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle quick login - simplified to go directly to home
  const handleQuickLogin = async () => {
    try {
      await login(loginData);
      navigate('/home');
    } catch (err) {
      toast({
        title: "Login Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle quick registration
  const handleQuickRegister = async () => {
    try {
      await register(registerData);
      navigate('/home');
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900">RelaxGo</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your on-demand massage app
          </p>
        </motion.div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="Your email address"
                      className="pl-10" 
                      value={loginData.email}
                      onChange={handleLoginChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-sm text-cyan-600">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      placeholder="Your password"
                      className="pl-10" 
                      value={loginData.password}
                      onChange={handleLoginChange}
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
                  disabled={loading}
                  onClick={handleQuickLogin}
                >
                  {loading ? 'Logging in...' : 'Quick Login'}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="bg-blue-50 text-blue-800 hover:bg-blue-100"
                    onClick={() => navigate('/home')}
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    Skip Login
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="firstName" 
                        name="firstName"
                        placeholder="First name"
                        className="pl-10" 
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      placeholder="Last name" 
                      value={registerData.lastName}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="regEmail" 
                      name="email"
                      type="email" 
                      placeholder="Your email address"
                      className="pl-10" 
                      value={registerData.email}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="phoneNumber" 
                      name="phoneNumber"
                      placeholder="Your phone number"
                      className="pl-10" 
                      value={registerData.phoneNumber}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="regPassword" 
                      name="password"
                      type="password" 
                      placeholder="Create a password"
                      className="pl-10" 
                      value={registerData.password}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
                  disabled={loading}
                  onClick={handleQuickRegister}
                >
                  {loading ? 'Registering...' : 'Quick Register'}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="bg-blue-50 text-blue-800 hover:bg-blue-100"
                    onClick={() => navigate('/home')}
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    Skip Registration
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthScreen;
