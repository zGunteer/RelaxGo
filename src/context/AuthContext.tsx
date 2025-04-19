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
                setLoading(false);
              } else if (profileError) {
                console.error('Error fetching user profile after OAuth:', profileError);
                setError(`Failed to fetch user profile: ${profileError.message}`);
                setLoading(false);
              }
            });
        }
        
        // The onAuthStateChange listener will handle this when it fires with SIGNED_IN event
        // But just in case it doesn't fire, we should still set loading to false after a timeout
        setTimeout(() => {
          setLoading(prevLoading => {
            if (prevLoading) {
              console.log('Setting loading to false (session timeout fallback)');
              return false;
            }
            return prevLoading;
          });
        }, 2000); // 2 second timeout as fallback for session case
      } else {
        console.log('No initial session found');
        // If no session, ensure loading becomes false after a short timeout
        // This is a safety measure in case onAuthStateChange doesn't fire immediately
        setTimeout(() => {
          setLoading(prevLoading => {
            if (prevLoading) {
              console.log('Setting loading to false (timeout fallback)');
              return false;
            }
            return prevLoading;
          });
        }, 1000); // 1 second timeout as fallback
      }
    }).catch(err => {
      console.error('Error getting initial session:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            const userId = session.user.id;
            const userEmail = session.user.email || '';
            const userMetaData = session.user.user_metadata;

            // Try to fetch user profile from 'users' table
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*') 
              .eq('id', userId)
              .single();

            if (profile) {
              // Profile found - Combine and set user state
              const combinedUser: User = {
                id: userId,
                email: userEmail,
                firstName: profile.name?.split(' ')[0] || '',
                lastName: profile.name?.split(' ').slice(1).join(' ') || '',
                role: profile.role as UserRole || UserRole.CLIENT, 
                phoneNumber: profile.phone,
                createdAt: session.user.created_at,
              };
              setUser(combinedUser);
              console.log('User profile found and user state set.', combinedUser);
            } else if (profileError && profileError.code === 'PGRST116') { 
              // Profile not found (PGRST116: Row not found) - Potentially a new social login
              console.warn('User profile not found, attempting to create one for social login.');
              
              // Attempt to create a new profile using metadata
              const { error: insertError } = await supabase.from('users').insert({
                id: userId,
                // Use metadata from provider if available (structure might vary)
                name: userMetaData?.full_name || userMetaData?.name || 'New User', 
                email: userEmail, // Add email column if it exists in 'users' table
                phone: null, // No phone number from social provider typically
                role: UserRole.CLIENT // Default role for new social users
              });

              if (insertError) {
                console.error('Error creating user profile after social login:', insertError);
                setError(`Failed to create profile after login: ${insertError.message}`);
                // Sign out if profile creation fails?
                await supabase.auth.signOut();
                setUser(null);
              } else {
                console.log('New user profile created successfully after social login.');
                // Re-fetch the newly created profile to ensure consistency (or construct user object directly)
                const { data: newProfile } = await supabase.from('users').select('*').eq('id', userId).single();
                if (newProfile) {
                     const combinedUser: User = {
                        id: userId,
                        email: userEmail,
                        firstName: newProfile.name?.split(' ')[0] || '',
                        lastName: newProfile.name?.split(' ').slice(1).join(' ') || '',
                        role: newProfile.role as UserRole || UserRole.CLIENT, 
                        phoneNumber: newProfile.phone,
                        createdAt: session.user.created_at,
                      };
                      setUser(combinedUser);
                      console.log('Newly created profile fetched and user state set.', combinedUser);
                } else {
                    // Should not happen if insert succeeded, but handle defensively
                    setError('Failed to fetch newly created profile.');
                    await supabase.auth.signOut();
                    setUser(null);
                }
              }
            } else if (profileError) {
              // Other error fetching profile
              console.error('Error fetching user profile:', profileError);
              setError(`Failed to fetch user profile: ${profileError.message}`);
              await supabase.auth.signOut(); // Sign out on other profile errors
              setUser(null); 
            } else {
                 // Should not happen if profileError is null and profile is null, but handle defensively
                 console.error('Unexpected state: No profile and no profile error.');
                 setError('Failed to retrieve user profile information.');
                 await supabase.auth.signOut();
                 setUser(null);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            console.log('User signed out, user state set to null.');
          } else if (event === 'USER_UPDATED' && session?.user) {
            // Handle user updates if needed (e.g., email change confirmed)
            // Re-fetch profile or update user state based on session.user
            console.log('User updated');
            // Potentially re-fetch profile if metadata might have changed
            // fetchAndSetUser(session.user.id); 
          } else if (event === 'PASSWORD_RECOVERY') {
            // Handle password recovery event if needed
            console.log('Password recovery event');
          } else if (event === 'TOKEN_REFRESHED') {
            // Token refreshed, session might be updated
            console.log('Token refreshed');
            // Usually no state change needed here unless you use the token directly
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        // We could potentially put some data here, but it's better in the users table
        // options: {
        //   data: {
        //     role: data.role || UserRole.CLIENT, // Example
        //   }
        // }
      });

      if (authError) {
        throw authError; // Throw signup error
      }

      // Check if signup returned a user (might require email confirmation)
      if (!authData.user) {
        // This might happen if email confirmation is required.
        // Inform the user they need to confirm their email.
        // You might want to handle this state differently (e.g., show a message)
        // For now, we'll throw an error or just log it.
        console.log('Registration requires email confirmation.');
        // Optionally set an error or state indicating confirmation needed
        // setError('Please check your email to confirm your registration.');
        // setLoading(false); // Stop loading here if confirmation is needed
        // return; // Stop execution if confirmation is pending
        // OR throw an error if immediate profile creation is expected:
        throw new Error('User registration succeeded but requires email confirmation. Profile not created yet.');
      }

      // 2. Insert additional user info into the public 'users' table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Link to the auth.users table
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(), // Concatenate names
          phone: data.phoneNumber, // Map phoneNumber to phone
          role: data.role || UserRole.CLIENT // Use provided role or default
        });

      if (profileError) {
        // Optional: Handle profile insertion failure (e.g., delete the auth user?)
        console.error('Error inserting user profile:', profileError);
        //setError(`Registration succeeded, but failed to create profile: ${profileError.message}`);
        throw profileError; // Throw profile insertion error
      }

      // Registration and profile creation successful
      // Note: User state will be set by onAuthStateChange listener later.
      console.log('Registration and profile creation successful:', authData.user);

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

      // Prepare the data object for Supabase update
      // Only include fields that are present in the input data
      const updateData: { name?: string; phone?: string; [key: string]: any } = {};
      
      // Handle name update (combine first and last name if provided)
      const currentFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const newFirstName = data.firstName !== undefined ? data.firstName : user.firstName;
      const newLastName = data.lastName !== undefined ? data.lastName : user.lastName;
      const newFullName = `${newFirstName || ''} ${newLastName || ''}`.trim();
      
      if (newFullName !== currentFullName && newFullName !== '') {
          updateData.name = newFullName;
      }
      
      // Handle phone number update
      if (data.phoneNumber !== undefined && data.phoneNumber !== user.phoneNumber) {
        updateData.phone = data.phoneNumber;
      }
      
      // Add other fields from ProfileUpdateInput if they exist in your 'users' table
      // Example: if you add a 'bio' column to 'users' table:
      // if (data.bio !== undefined) {
      //   updateData.bio = data.bio;
      // }
      // Example: if you add an 'address' column:
      // if (data.address !== undefined) {
      //   updateData.address = data.address;
      // }

      // Only proceed if there is data to update
      if (Object.keys(updateData).length === 0) {
        console.log('No profile data to update.');
        setLoading(false);
        return; // Nothing to update
      }

      // Perform the update query
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update successful, update local user state to reflect changes immediately
      const updatedUserFields: Partial<User> = {};
      if (updateData.name) {
        updatedUserFields.firstName = newFirstName;
        updatedUserFields.lastName = newLastName;
      }
      if (updateData.phone !== undefined) { // Check for undefined, allows setting to null/empty
          updatedUserFields.phoneNumber = data.phoneNumber;
      }
      // Update other fields in local state if needed
      // if (updateData.bio !== undefined) { updatedUserFields.bio = data.bio; } // Assuming bio is added to User type
      
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUserFields } : null);
      console.log('Profile updated successfully.');

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