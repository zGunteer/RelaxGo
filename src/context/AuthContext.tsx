import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
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
import { AuthChangeEvent, Provider, Session, User as AuthUser } from '@supabase/supabase-js'; // Import Provider type and Session type

// Session storage key
const SESSION_STORAGE_KEY = 'relaxgo_user_session';

// Utility functions for session caching
const saveSessionToCache = (session: Session | null) => {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        user_id: session.user.id,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        cached_at: Date.now()
      }));
      console.log('[SessionCache] Session saved for user:', session.user.id);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('[SessionCache] Session cache cleared');
    }
  } catch (error) {
    console.error('[SessionCache] Error saving session:', error);
  }
};

const getCachedSession = () => {
  try {
    const cached = localStorage.getItem(SESSION_STORAGE_KEY);
    if (cached) {
      const sessionData = JSON.parse(cached);
      console.log('[SessionCache] Found cached session for user:', sessionData.user_id);
      return sessionData;
    }
  } catch (error) {
    console.error('[SessionCache] Error reading cached session:', error);
  }
  return null;
};

interface UserProfile {
  id: string;
  role: string | null; // Legacy single role
  roles?: string[] | null; // New multiple roles array (optional for backwards compatibility)
  first_name: string | null;
  last_name: string | null;
  // You can add other profile fields here if needed later
}

// Auth context interface
interface AuthContextType {
  session: Session | null;
  authUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  fetchUserProfile: (userToFetch: AuthUser) => Promise<void>; // Add function to manually refresh profile if needed
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props interface for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileFetchInitiatedForUserId, setProfileFetchInitiatedForUserId] = useState<string | null>(null);

  // Refs to hold current state for use in onAuthStateChange callback
  const authUserRef = useRef(authUser);
  const userProfileRef = useRef(userProfile);
  const profileFetchInitiatedForUserIdRef = useRef(profileFetchInitiatedForUserId);
  const loadingRef = useRef(loading);

  // Effect to keep refs updated
  useEffect(() => {
    authUserRef.current = authUser;
    userProfileRef.current = userProfile;
    profileFetchInitiatedForUserIdRef.current = profileFetchInitiatedForUserId;
    loadingRef.current = loading;
  }, [authUser, userProfile, profileFetchInitiatedForUserId, loading]);

  const createFallbackProfile = useCallback((user: AuthUser | null): UserProfile | null => {
    if (!user) return null;
    return {
      id: user.id,
      role: 'client', 
      first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || '',
      last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || ''
    };
  }, []);

  const createPublicUserRecord = useCallback(async (user: AuthUser | null): Promise<UserProfile | null> => {
    if (!user) {
      console.log('[createPublicUserRecord] No auth user to create record from.');
      return null;
    }

    const profileData = {
      id: user.id,
      role: 'client',
      roles: ['client'], // Initialize with client role
      first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || user.email?.split('@')[0] || 'User',
      last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || '',
    };
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select('id, role, roles, first_name, last_name')
        .single();
      if (error) {
        console.error('[createPublicUserRecord] Supabase error:', error.message);
        return null;
      }
      return data;
    } catch (insertCatchError: any) {
      console.error('[createPublicUserRecord] Catch block error:', insertCatchError.message);
      return null;
    }
  }, []);
  
  const fetchUserProfile = useCallback(async (userToFetch: AuthUser, retryCount = 0) => {
    const userId = userToFetch.id;
    console.log('[fetchUserProfile] Starting fetch for user ID:', userId, 'retry:', retryCount);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      const fetchPromise = supabase
        .from('users')
        .select('id, role, roles, first_name, last_name')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error && error.code !== 'PGRST116') {
        console.error('[fetchUserProfile] Error fetching profile:', error.message);
        setUserProfile(createFallbackProfile(userToFetch));
      } else if (!data) {
        console.warn('[fetchUserProfile] No profile in public.users, creating one...');
        const newProfile = await createPublicUserRecord(userToFetch);
        setUserProfile(newProfile || createFallbackProfile(userToFetch));
      } else {
        setUserProfile(data);
      }
    } catch (catchError: any) {
      console.error("[fetchUserProfile] Profile fetch catch block:", catchError.message);
      setUserProfile(createFallbackProfile(userToFetch));
    }
    console.log('[fetchUserProfile] Finished function for ID:', userId);
  }, [createFallbackProfile, createPublicUserRecord]);

  // Effect for one-time initialization
  useEffect(() => {
    const initializeAuthOnce = async () => {
      console.log('[AuthContext] initializeAuthOnce: Starting...');
      setLoading(true);
      try {
        // Check for cached session first
        const cachedSession = getCachedSession();
        if (cachedSession) {
          console.log('[AuthContext] Found cached session for user:', cachedSession.user_id);
        }
        
        // Wait a bit to ensure localStorage is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[AuthContext] initializeAuthOnce: Session fetch error:", sessionError.message);
          setSession(null); setAuthUser(null); setUserProfile(null); setProfileFetchInitiatedForUserId(null);
          return;
        }

        if (currentSession?.user) {
          const currentAuthUser = currentSession.user;
          console.log('[AuthContext] initializeAuthOnce: Existing session found for user ID:', currentAuthUser.id);
          
          // Verify this matches our cached session (if any)
          if (cachedSession && cachedSession.user_id !== currentAuthUser.id) {
            console.warn('[AuthContext] Session mismatch! Cached:', cachedSession.user_id, 'Current:', currentAuthUser.id);
          }
          
          setSession(currentSession);
          setAuthUser(currentAuthUser);
          setUserProfile(createFallbackProfile(currentAuthUser));
          saveSessionToCache(currentSession);
        } else {
          console.log('[AuthContext] initializeAuthOnce: No existing session found.');
          setSession(null); setAuthUser(null); setUserProfile(null); setProfileFetchInitiatedForUserId(null);
          saveSessionToCache(null);
        }
      } catch (error: any) {
        console.error("[AuthContext] initializeAuthOnce: Initialization Error:", error.message);
        setSession(null); setAuthUser(null); setUserProfile(null); setProfileFetchInitiatedForUserId(null);
        saveSessionToCache(null);
      } finally {
        if (!authUserRef.current) {
             setLoading(false);
        }
        console.log('[AuthContext] initializeAuthOnce: Finished.');
      }
    };
  
    initializeAuthOnce();
  }, [createFallbackProfile]);


  // Effect for handling auth state changes
  useEffect(() => {
    console.log('[AuthContext] Subscribing to onAuthStateChange.');

    const handleAuthStateChange = async (event: AuthChangeEvent, newSession: Session | null) => {
      // Use refs to access the latest state values
      const currentAuthUser = authUserRef.current;
      const currentUserProfile = userProfileRef.current;
      const currentProfileFetchInitiated = profileFetchInitiatedForUserIdRef.current;
      const currentLoading = loadingRef.current;

      console.log(`[AuthContext] Event: ${event}. Profile from ref: ${currentUserProfile?.id}. Fetch initiated from ref: ${currentProfileFetchInitiated}. New session user: ${newSession?.user?.id}`);
      
      const newSupabaseUser = newSession?.user ?? null;
      
      // Save or clear session cache
      saveSessionToCache(newSession);
      
      setSession(newSession); // Update session state directly
      setAuthUser(newSupabaseUser); // Update authUser state directly

      let actuallyFetching = false;
      const eventTriggersLoading = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION';

      try {
        if (event === 'SIGNED_OUT') {
          if (!currentLoading && eventTriggersLoading) setLoading(true);
          console.log('[AuthContext] SIGNED_OUT: Clearing profile.');
          setUserProfile(null);
          setProfileFetchInitiatedForUserId(null);
        } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSupabaseUser) {
          const newUserId = newSupabaseUser.id;
          console.log(`[AuthContext] ${event}: User ID: ${newUserId}. Checking profile.`);

          if (currentUserProfile && currentUserProfile.id === newUserId) {
            console.log(`[AuthContext] ${event}: Profile already loaded and matches for ID:`, newUserId);
            if (currentProfileFetchInitiated !== newUserId) {
              console.log(`[AuthContext] ${event}: Aligning profileFetchInitiatedForUserId for ID:`, newUserId);
              setProfileFetchInitiatedForUserId(newUserId);
            }
          } else {
            console.log(`[AuthContext] ${event}: Profile not loaded or different for ID: ${newUserId}. Current profile from ref: ${currentUserProfile?.id}. Fetch initiated from ref: ${currentProfileFetchInitiated}`);
            if (currentProfileFetchInitiated !== newUserId) {
              console.log(`[AuthContext] ${event}: Initiating profile fetch for ID:`, newUserId);
              if (!currentLoading && eventTriggersLoading) setLoading(true);
              actuallyFetching = true;
              setProfileFetchInitiatedForUserId(newUserId);
              await fetchUserProfile(newSupabaseUser);
              console.log(`[AuthContext] ${event}: fetchUserProfile completed for ID:`, newUserId);
            } else {
              console.log(`[AuthContext] ${event}: Profile fetch already marked initiated for ID: ${newUserId}. Waiting or failed.`);
            }
          }
        } else if (event === 'USER_UPDATED') {
          console.log('[AuthContext] USER_UPDATED event.');
          if (newSupabaseUser && currentAuthUser && newSupabaseUser.id !== currentAuthUser.id) {
            console.log('[AuthContext] USER_UPDATED: User ID changed. Resetting states.');
            if (!currentLoading) setLoading(true);
            setUserProfile(null);
            setProfileFetchInitiatedForUserId(null);
          } else if (newSupabaseUser) {
             console.log('[AuthContext] USER_UPDATED: User metadata might have changed, ID same. Profile not re-fetched by default.');
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log(`[AuthContext] TOKEN_REFRESHED: Updating session cache. AuthUser from ref: ${currentAuthUser?.id}, New Session User: ${newSupabaseUser?.id}`);
          if (currentAuthUser?.id !== newSupabaseUser?.id && newSupabaseUser) {
             console.warn('[AuthContext] TOKEN_REFRESHED: User ID changed unexpectedly. Updating authUser state.');
          }
        }
      } catch (profileError: any) {
        console.error(`[AuthContext] Error during profile logic for event ${event}:`, profileError.message);
      } finally {
        if (eventTriggersLoading) {
          if (currentLoading || actuallyFetching) { 
             setLoading(false);
             console.log(`[AuthContext] Event ${event}: Set loading to false in finally block.`);
          }
        }
      }
    };
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
  
    // Cleanup subscription on component unmount or when dependencies change
    return () => {
      console.log('[AuthContext] Unsubscribing from onAuthStateChange.');
      if (subscription) {
        subscription.unsubscribe();
      }
    };
    // Dependencies: Re-subscribe if these state values change, so the callback has a fresh closure.
  }, [fetchUserProfile]); // Empty dependency array ensures this runs only once. fetchUserProfile is memoized.
  // Note: fetchUserProfile, createFallbackProfile, createPublicUserRecord are stable due to useCallback or being defined outside/at top-level if they don't depend on changing state.
  // Here they are instance methods, so they change on every render. To make them stable for the dependency array, wrap them in useCallback.
  // For simplicity now, assuming their definitions are stable enough or they correctly use passed-in parameters.
  // A more robust solution would wrap fetchUserProfile etc. in useCallback with their own dependencies.

  const isAdmin = userProfile?.role === 'admin';
  const isAuthenticated = !!session && !!authUser;
  
  if (typeof window !== 'undefined') {
    (window as any).testCreateUser = async () => {
      console.log('[testCreateUser] Starting manual user creation test...');
      const { data: { session: currentSess } } = await supabase.auth.getSession();
      if (currentSess?.user) {
        console.log('[testCreateUser] Current user:', currentSess.user);
        const result = await createPublicUserRecord(currentSess.user);
        console.log('[testCreateUser] Result:', result);
      } else {
        console.log('[testCreateUser] No authenticated user found');
      }
    };
     (window as any).getAuthContextState = () => ({
      session,
      authUser: authUserRef.current, // Provide ref values for debugging
      userProfile: userProfileRef.current,
      loading: loadingRef.current,
      isAdmin: userProfileRef.current?.role === 'admin',
      isAuthenticated: !!authUserRef.current,
      profileFetchInitiatedForUserId: profileFetchInitiatedForUserIdRef.current
    });
  }

  const value: AuthContextType = {
    session,
    authUser,
    userProfile,
    loading,
    isAdmin: userProfile?.role === 'admin',
    isAuthenticated: !!authUser,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};