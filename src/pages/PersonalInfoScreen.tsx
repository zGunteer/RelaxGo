import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// Import UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone number validation regex (simple version)
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

const PersonalInfoScreen = () => {
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUser();
  
  const [error, setError] = useState<string | null>(null);

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
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4">
        <Card className="border-none shadow-sm">
          {userLoading ? (
            <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading your information...</span>
            </CardContent>
          ) : (
            <>
              {error && (
                <CardContent className="pt-6 pb-0">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </CardContent>
              )}
              
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={userInfo.firstName || ''}
                    className="bg-gray-100"
                    readOnly
                    placeholder="-"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={userInfo.lastName || ''}
                    className="bg-gray-100"
                    readOnly
                    placeholder="-"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={userInfo.phone || ''}
                    className="bg-gray-100"
                    readOnly
                    placeholder="-"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userInfo.email || ''}
                    className="bg-gray-100"
                    readOnly
                    placeholder="-"
                  />
                  <p className="text-xs text-gray-500">Email address cannot be changed here</p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <NavBar />
    </div>
  );
};

export default PersonalInfoScreen; 