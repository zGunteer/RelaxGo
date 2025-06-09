import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { useAuth } from '@/context/AuthContext';
import { LoginInput, RegisterInput, SocialProvider, UserRole } from '@/services/AuthService';
import { supabase } from '@/lib/supabaseClient';
import { Provider } from '@supabase/supabase-js';

const AuthScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { loading: authLoading, session, authUser, isAdmin, userProfile } = useAuth();
  
  // Local loading states for buttons
  const [loginButtonLoading, setLoginButtonLoading] = useState(false);
  const [registerButtonLoading, setRegisterButtonLoading] = useState(false);
  const [socialButtonLoading, setSocialButtonLoading] = useState(false);
  
  // Get the return URL from location state or default to home
  const from = (location.state as any)?.from || '/home';
  
  // Handle redirect after login/auth state change
  useEffect(() => {
    console.log('[AuthScreen useEffect] Running. Deps:', { authLoading, isAdmin, session });
    
    if (!authLoading && session) {
      if (isAdmin) {
        console.log('[AuthScreen useEffect] Admin detected! Navigating to /admin');
        navigate('/admin', { replace: true });
      } else {
        const destination = from === '/auth' ? '/home' : from;
        console.log(`[AuthScreen useEffect] Non-admin user detected. Navigating to: ${destination}`);
        navigate(destination, { replace: true });
      }
    } else {
      console.log('[AuthScreen useEffect] Conditions NOT met (loading or no session).');
    }
  }, [session, navigate, authLoading, isAdmin, from]);
  
  // Login form state
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  
  // Register form state
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
      setLoginButtonLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (authError) {
        throw authError;
      }
      // Let useEffect handle navigation
      toast({ title: "Login Attempted", description: "Checking credentials..." });

    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "Login Failed",
        description: err.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('[AuthScreen handleQuickLogin] Reached finally block.');
      setLoginButtonLoading(false);
    }
  };
  
  // Handle social login click
  const handleSocialLoginClick = async (provider: SocialProvider) => {
    setSocialButtonLoading(true);
    try {
      console.log(`Initiating login with ${provider}`);
      localStorage.setItem('attemptingSocialLogin', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase() as Provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
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
      setRegisterButtonLoading(true);
    try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: registerData.email,
            password: registerData.password,
            options: {
                // Pass user metadata for potential function hook usage
                data: {
                    first_name: registerData.firstName,
                    last_name: registerData.lastName,
                    phone: registerData.phoneNumber,
                    // Role might be set by a trigger/hook based on signup
                }
            }
        });

        if (signUpError) {
            throw signUpError;
        }

        // Check if confirmation is needed (no immediate session/identities)
        if (signUpData.user && !signUpData.session && signUpData.user.identities?.length === 0) {
             toast({
                title: "Confirmation Email Sent",
                description: "Please check your email to complete registration.",
            });
        } else if (signUpData.session) {
             // Session created (auto-confirm or existing user re-auth)
             toast({ title: "Registration Successful", description: "Logging you in..." });
             // Let useEffect handle navigation
        } else {
             // Handle other cases if necessary, e.g., user exists but needs login
             toast({
                title: "Registration Info Submitted",
                description: "If you have an account, please log in. Otherwise, check your email.",
            });
        }

    } catch (err: any) {
        console.error("Registration error:", err);
      toast({
        title: "Registration Failed",
            description: err.message || "An error occurred. Please try again.",
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
                      required
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
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
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
                    className="justify-center w-full flex items-center"
                    onClick={() => handleSocialLoginClick(SocialProvider.GOOGLE)}
                    disabled={socialButtonLoading}
                  >
                    {socialButtonLoading ? 'Processing...' : <><FcGoogle className="mr-2 h-5 w-5" /> Continue with Google</>}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="reg-firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                      id="reg-firstName" 
                        name="firstName"
                      type="text" 
                      placeholder="First Name"
                        className="pl-10" 
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                      required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                  <Label htmlFor="reg-lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="reg-lastName" 
                      name="lastName"
                      type="text" 
                      placeholder="Last Name"
                      className="pl-10" 
                      value={registerData.lastName}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="reg-phoneNumber" 
                      name="phoneNumber"
                      type="tel"
                      placeholder="Phone Number"
                      className="pl-10" 
                      value={registerData.phoneNumber}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="reg-email" 
                      name="email"
                      type="email" 
                      placeholder="Your email address"
                      className="pl-10" 
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="reg-password" 
                      name="password"
                      type="password" 
                      placeholder="Create a password"
                      className="pl-10" 
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                  disabled={registerButtonLoading}
                  onClick={handleQuickRegister}
                >
                  {registerButtonLoading ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthScreen;
