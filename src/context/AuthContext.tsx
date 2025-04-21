import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User, 
  LoginInput, 
  RegisterInput, 
  SocialLoginInput, 
  ProfileUpdateInput,
  UserRole,
  SocialProvider
} from '../services/AuthService';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import { Provider } from '@supabase/supabase-js'; // Import Provider type

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  socialLogin: (provider: SocialProvider) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateInput) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
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
  sendPasswordResetEmail: async () => {},
  clearError: () => {}
});

// Props interface for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Start with loading true until the initial auth state is determined
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null);
  
  // Handle auth state changes
  useEffect(() => {
    // Set loading to true initially
    setLoading(true);
    setError(null); // Clear error on initial load/auth change

    console.log('AuthContext: Initializing auth state');

    // Check if there's an OAuth redirect happening (looking for access_token in URL or hash)
    const isOAuthRedirect = window.location.hash.includes('access_token') || 
                           new URLSearchParams(window.location.search).has('access_token');
    
    if (isOAuthRedirect) {
      console.log('AuthContext: Detected OAuth redirect params in URL');
    }

    // Get initial session - This will set loading to false even if no auth event is triggered
    supabase.auth.getSession().then(({ data }) => {
      console.log('AuthContext: Initial session check result:', data.session ? 'Session found' : 'No session');
      
      if (data.session) {
        console.log('Initial session found:', data.session);
        // If we detect we're in an OAuth redirect, we can manually trigger user fetch
        if (isOAuthRedirect || localStorage.getItem('attemptingSocialLogin')) {
          console.log('AuthContext: Handling social login redirect');
          // Remove the flag
          localStorage.removeItem('attemptingSocialLogin');
          
          // Manually fetch user profile
          const userId = data.session.user.id;
          supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
            .then(({ data: profile, error: profileError }) => {
              if (profile) {
                console.log('AuthContext: Fetched user profile after social login');
                const combinedUser: User = {
                  id: userId,
                  email: data.session?.user.email || '',
                  firstName: profile.name?.split(' ')[0] || '',
                  lastName: profile.name?.split(' ').slice(1).join(' ') || '',
                  role: profile.role as UserRole || UserRole.CLIENT,
                  phoneNumber: profile.phone,
                  createdAt: data.session?.user.created_at,
                };
                setUser(combinedUser);
                // Loading will be set to false by the onAuthStateChange listener
                // setLoading(false); 
              } else if (profileError) {
                console.error('Error fetching user profile after OAuth:', profileError);
                setError(`Failed to fetch user profile: ${profileError.message}`);
                setLoading(false); // Set loading false on error here
              }
            });
        }
        
        // The onAuthStateChange listener will handle the SIGNED_IN event and set loading=false.
        // No need for a fallback timeout here.
        
      } else {
        console.log('No initial session found');
        // If no session, onAuthStateChange will still fire (or has fired)
        // and set loading=false in its finally block.
        // No need for a fallback timeout here.
      }
    }).catch(err => {
      console.error('Error getting initial session:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // ADDED: Log entry into the callback
        console.log('[AuthContext] onAuthStateChange triggered. Event:', event, 'Session Exists:', !!session);
        
        console.log('Auth event:', event, 'Session:', session); // Keep original log too
        try {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
            const userId = session.user.id;
            const userEmail = session.user.email || '';
            // const userMetaData = session.user.user_metadata; // We don't need metadata here anymore

            // Try to fetch user profile from 'users' table.
            // The trigger should have created it if it was missing.
            // Let's add a small delay/retry mechanism in case the trigger hasn't finished yet.
            let profile = null;
            let profileError = null;
            let attempts = 0;
            while (!profile && attempts < 3) {
              attempts++;
              const { data, error } = await supabase
                .from('users')
                .select('*') 
                .eq('id', userId)
                .single();
              
              if (data) {
                profile = data;
                profileError = null;
                break; // Exit loop if profile found
              } else {
                profileError = error;
                if (attempts < 3) {
                  console.warn(`Profile fetch attempt ${attempts} failed, retrying...`);
                  await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retrying
                }
              }
            }

            if (profile) {
              // Profile found - Combine and set user state
              console.log('[AuthContext] Profile found for user:', userId);
              console.log('[AuthContext] Raw profile data:', profile);
              
              const fetchedFirstName = profile.first_name;
              const fetchedLastName = profile.last_name;
              const fetchedPhone = profile.phone;
              
              console.log('[AuthContext] Extracted values: firstName:', fetchedFirstName, 'lastName:', fetchedLastName, 'phone:', fetchedPhone);
              
              const combinedUser: User = {
                id: userId,
                email: userEmail,
                // Use the columns directly from the fetched profile
                firstName: fetchedFirstName || '', 
                lastName: fetchedLastName || '', 
                role: profile.role as UserRole || UserRole.CLIENT, 
                phoneNumber: fetchedPhone, // Use phone column variable
                createdAt: profile.created_at || session.user.created_at,
              };
              
              console.log('[AuthContext] Setting user state with:', combinedUser);
              setUser(combinedUser);
              // console.log('User profile found/fetched and user state set.', combinedUser);
            } else {
              // Profile not found after retries - this indicates a problem
              console.error('Failed to fetch user profile even after trigger should have run:', profileError);
              setError(`Failed to load user profile: ${profileError?.message || 'Unknown error'}`);
              // Sign out if we can't get the profile
              await supabase.auth.signOut();
              setUser(null);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            console.log('User signed out, user state set to null.');
          } else if (event === 'PASSWORD_RECOVERY') {
            // Handle password recovery event if needed
            console.log('Password recovery event');
          } else if (event === 'TOKEN_REFRESHED') {
            // Token refreshed, session might be updated
            console.log('Token refreshed');
          }
        } catch (err) {
          console.error('Error in onAuthStateChange handler:', err);
          setError('An error occurred handling authentication state.');
          setUser(null); // Clear user state on error
        } finally {
          // Set loading to false once the initial state or change is processed
          setLoading(false);
        }
      }
    );

    // Cleanup function to unsubscribe
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      
      // Clear any pending timeouts to avoid memory leaks and state updates after unmount
      console.log('Cleaning up auth state change effect');
    };
  }, []); // Run only once on mount
  
  // Login method - uses Supabase
  const login = async (data: LoginInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError; // Throw the error to be caught below
      }

      // Note: Supabase handles session persistence automatically.
      // We'll set the user state via onAuthStateChange listener later.
      // For now, we can potentially set the user based on the response if needed immediately,
      // but the listener is the more robust way.
      console.log('Login successful:', authData); // Optional: log success

    } catch (err) {
      console.error('Login error:', err);
      // Ensure err has a message property before setting the error state
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred during login';
      setError(errorMessage);
      throw err; // Re-throw the error if you want calling components to handle it
    } finally {
      setLoading(false);
    }
  };
  
  // Register method - uses Supabase auth and inserts into users table
  const register = async (data: RegisterInput) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Sign up the user with Supabase Auth
      // Pass metadata so the trigger can potentially use it
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phoneNumber, // Pass phone if available
            // Role is defaulted in the trigger, no need to pass here unless you want override capability
          }
        }
      });

      if (authError) {
        throw authError; // Throw signup error
      }

      // Check if signup returned a user (might require email confirmation)
      if (!authData.user) {
        console.log('Registration requires email confirmation.');
        // No profile insertion needed here - trigger handles it.
        throw new Error('User registration succeeded but requires email confirmation. Please check your email.');
      }

      // 2. NO LONGER NEEDED: Insert additional user info into the public 'users' table
      // The trigger `handle_new_user` now takes care of this.
      
      // Registration successful (or pending confirmation)
      // The onAuthStateChange listener will handle setting the user state eventually.
      console.log('Registration request successful:', authData.user?.id);

    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred during registration';
      setError(errorMessage);
      throw err; // Re-throw error
    } finally {
      setLoading(false);
    }
  };
  
  // Social login method - uses Supabase OAuth
  const socialLogin = async (provider: SocialProvider) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert the provider enum value to lowercase string expected by Supabase
      const supabaseProvider = provider.toLowerCase() as Provider;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          // Specify redirect URL directly to home page instead of auth page
          redirectTo: `${window.location.origin}/home`,
          // You can add scopes here if needed, e.g., 'profile email'
          // scopes: 'profile email',
        },
      });

      if (error) {
        throw error;
      }

      // Redirect happens automatically. The onAuthStateChange listener will handle the rest.
      // No need to setUser here.

    } catch (err) {
      console.error('Social login error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred during social login';
      setError(errorMessage);
      // Don't re-throw usually, as the redirect might happen anyway or error is handled
    } finally {
      // Loading state might need adjustment depending on how redirects affect the component lifecycle
      // It might be better to set loading=false within onAuthStateChange in some cases
      setLoading(false);
    }
  };
  
  // Logout method - uses Supabase
  const logout = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error; // Throw the error to be caught below
      }

      // User state will be set to null by the onAuthStateChange listener.
      // setUser(null); // This will be handled automatically

    } catch (err) {
      console.error('Logout error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred during logout';
      setError(errorMessage);
      // We might not need to re-throw here unless a calling component needs it
      // throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update profile method - uses Supabase
  const updateProfile = async (data: ProfileUpdateInput) => {
    if (!user) {
      throw new Error('User must be logged in to update profile.');
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the data object for Supabase update in public.users table
      const updateData: { 
        first_name?: string; 
        last_name?: string; 
        phone?: string | null; 
        name?: string; // Keep the combined name field for compatibility?
        [key: string]: any 
      } = {};
      
      // Handle name update (update first_name and last_name)
      let nameChanged = false;
      if (data.firstName !== undefined && data.firstName !== user.firstName) {
        updateData.first_name = data.firstName;
        nameChanged = true;
      }
      if (data.lastName !== undefined && data.lastName !== user.lastName) {
        updateData.last_name = data.lastName;
        nameChanged = true;
      }
      
      // Update the combined 'name' field if individual names changed
      if (nameChanged) {
        const newFirstName = data.firstName !== undefined ? data.firstName : user.firstName;
        const newLastName = data.lastName !== undefined ? data.lastName : user.lastName;
        updateData.name = `${newFirstName || ''} ${newLastName || ''}`.trim();
      }
      
      // Handle phone number update
      if (data.phoneNumber !== undefined && data.phoneNumber !== user.phoneNumber) {
        updateData.phone = data.phoneNumber; // Assumes phoneNumber maps to phone column
      }
      
      // Add other potential fields here if needed, mapping ProfileUpdateInput to users table columns

      // Only proceed if there is data to update
      if (Object.keys(updateData).length === 0) {
        console.log('No profile data to update.');
        setLoading(false);
        return; // Nothing to update
      }

      // Perform the update query on public.users
      const { error: updateError } = await supabase
        .from('users') // Target the public.users table
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update successful, update local user state to reflect changes immediately
      const updatedUserFields: Partial<User> = {};
      if (updateData.first_name !== undefined) updatedUserFields.firstName = updateData.first_name;
      if (updateData.last_name !== undefined) updatedUserFields.lastName = updateData.last_name;
      if (updateData.phone !== undefined) updatedUserFields.phoneNumber = updateData.phone;
      // Update other fields if necessary
      
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUserFields } : null);
      console.log('Profile updated successfully in public.users.');

    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An error occurred while updating profile';
      setError(errorMessage);
      throw err; // Re-throw
    } finally {
      setLoading(false);
    }
  };
  
  // Send password reset email
  const sendPasswordResetEmail = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // This is the URL path where users will be redirected after clicking the link
        // We'll need to create a page/route to handle this later (e.g., /update-password)
        redirectTo: `${window.location.origin}/update-password`, 
      });

      if (error) {
        throw error;
      }

      // Optionally provide feedback to the user that the email has been sent
      console.log('Password reset email sent successfully.');

    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred sending reset email';
      setError(errorMessage);
      throw err; // Re-throw
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
        sendPasswordResetEmail,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 