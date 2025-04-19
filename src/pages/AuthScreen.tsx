import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Facebook, Mail, Lock, User, Phone } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { useAuth } from '@/context/AuthContext';
import { LoginInput, RegisterInput, SocialProvider, UserRole } from '@/services/AuthService';
import { supabase } from '../lib/supabaseClient';

const AuthScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, register, socialLogin, loading: authLoading, isAuthenticated, user } = useAuth();
  
  // Local loading states for buttons
  const [loginButtonLoading, setLoginButtonLoading] = useState(false);
  const [registerButtonLoading, setRegisterButtonLoading] = useState(false);
  const [socialButtonLoading, setSocialButtonLoading] = useState(false);
  
  // Get the return URL from location state or default to home
  const from = (location.state as any)?.from || '/home';
  
  // Handle redirect after social login - with direct Supabase session check
  useEffect(() => {
    console.log('Auth state check:', { isAuthenticated, user, authLoading });
    
    // First check - Use the context state if available
    if (isAuthenticated && user) {
      console.log('User authenticated via context state, redirecting to home');
      navigate('/home', { replace: true });
      return;
    }
    
    // Second check - Check if there's a Google OAuth redirect happening
    const isOAuthRedirect = window.location.hash.includes('access_token') || 
                          new URLSearchParams(window.location.search).has('access_token') ||
                          localStorage.getItem('attemptingSocialLogin') === 'true';
    
    if (isOAuthRedirect || localStorage.getItem('attemptingSocialLogin')) {
      console.log('Detected OAuth redirect or social login attempt');
      
      // Directly check Supabase session - don't rely only on the context
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          console.log('Found active session on OAuth redirect, redirecting to home');
          localStorage.removeItem('attemptingSocialLogin');
          navigate('/home', { replace: true });
        } else {
          console.log('No session found on OAuth redirect');
          localStorage.removeItem('attemptingSocialLogin');
        }
      }).catch(error => {
        console.error('Error checking session:', error);
        localStorage.removeItem('attemptingSocialLogin');
      });
    }
  }, [isAuthenticated, user, navigate, authLoading]);
  
  // Login form state - simplified
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  
  // Register form state - simplified
  const [registerData, setRegisterData] = useState<RegisterInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
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
  
  // Handle quick login 
  const handleQuickLogin = async () => {
    try {
      setLoginButtonLoading(true);
      await login(loginData);
      // Explicitly navigate to home page after successful login
      navigate(from, { replace: true }); 
      toast({ title: "Login Successful" });
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoginButtonLoading(false);
    }
  };
  
  // Handle social login click
  const handleSocialLoginClick = async (provider: SocialProvider) => {
    try {
      setSocialButtonLoading(true);
      console.log(`Initiating login with ${provider}`);
      
      // Set the flag before redirecting - we'll check this when redirected back
      localStorage.setItem('attemptingSocialLogin', 'true');
      
      await socialLogin(provider);
      // Redirect will happen automatically via Supabase
    } catch (err: any) {
      console.error('Social login error:', err);
      localStorage.removeItem('attemptingSocialLogin');
      toast({
        title: "Social Login Failed",
        description: err.message || `Failed to initiate login with ${provider}. Please try again.`,
        variant: "destructive"
      });
      setSocialButtonLoading(false);
    }
  };
  
  // Handle quick registration
  const handleQuickRegister = async () => {
    try {
      setRegisterButtonLoading(true);
      await register(registerData);
      navigate('/home');
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegisterButtonLoading(false);
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
                    <Link to="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-500">
                      Forgot password?
                    </Link>
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
                  disabled={loginButtonLoading}
                  onClick={handleQuickLogin}
                >
                  {loginButtonLoading ? 'Logging in...' : 'Login'}
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
                    className="justify-center"
                    onClick={() => handleSocialLoginClick(SocialProvider.GOOGLE)}
                    disabled={socialButtonLoading}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Continue with Google
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 mt-4"
                  disabled={registerButtonLoading}
                  onClick={handleQuickRegister}
                >
                  {registerButtonLoading ? 'Registering...' : 'Register'}
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
