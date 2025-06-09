import { supabase } from '@/lib/supabaseClient';
import { UserRole } from './AuthService';

/**
 * Service to manage masseur registration status
 * Checks database for actual masseur status and manages roles
 */

// Legacy localStorage key (for backwards compatibility)
const MASSEUR_STATUS_KEY = 'relaxgo:masseur_status';

// Check if the current user is an approved masseur in the database
export const isMasseurRegistered = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // First check the masseuses table for approval status
    const { data: masseur, error: masseurError } = await supabase
      .from('masseuses')
      .select('masseuse_id, status')
      .eq('masseuse_id', user.id)
      .single();

    if (masseurError && masseurError.code !== 'PGRST116') {
      console.error('Error checking masseur status:', masseurError);
      return false;
    }

    // If masseur exists and is approved, they are registered
    if (masseur?.status === 'approved') {
      // Also check if user has masseur role in their roles array
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single();

      if (!userError && userProfile) {
        const userRoles = userProfile.roles || [];
        
        // If user doesn't have masseur role, add it
        if (!userRoles.includes(UserRole.MASSEUR)) {
          await addMasseurRole(user.id);
        }
      }
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking masseur status:', error);
    return false;
  }
};

// Add masseur role to a user (called when masseur gets approved)
export const addMasseurRole = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('add_user_role', {
      user_id: userId,
      new_role: UserRole.MASSEUR
    });

    if (error) {
      console.error('Error adding masseur role:', error);
      return false;
    }

    console.log('Masseur role added successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('Error adding masseur role:', error);
    return false;
  }
};

// Remove masseur role from a user (called when masseur gets rejected/deactivated)
export const removeMasseurRole = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('remove_user_role', {
      user_id: userId,
      remove_role: UserRole.MASSEUR
    });

    if (error) {
      console.error('Error removing masseur role:', error);
      return false;
    }

    console.log('Masseur role removed successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('Error removing masseur role:', error);
    return false;
  }
};

// Check masseur status synchronously (for backwards compatibility)
// This checks localStorage first, but should be replaced with async version
export const isMasseurRegisteredSync = (): boolean => {
  try {
    return localStorage.getItem(MASSEUR_STATUS_KEY) === 'registered';
  } catch (error) {
    console.error('Error checking masseur status:', error);
    return false;
  }
};

// Save masseur registration status (legacy - consider removing)
export const setMasseurRegistered = (isRegistered: boolean): void => {
  try {
    if (isRegistered) {
      localStorage.setItem(MASSEUR_STATUS_KEY, 'registered');
    } else {
      localStorage.removeItem(MASSEUR_STATUS_KEY);
    }
  } catch (error) {
    console.error('Error saving masseur status:', error);
  }
};

// Clear masseur registration status (useful for logout)
export const clearMasseurStatus = (): void => {
  try {
    localStorage.removeItem(MASSEUR_STATUS_KEY);
  } catch (error) {
    console.error('Error clearing masseur status:', error);
  }
}; 