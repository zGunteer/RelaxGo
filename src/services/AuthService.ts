// Define user roles
export enum UserRole {
  CLIENT = 'client',
  MASSEUR = 'masseur',
  ADMIN = 'admin'
}

// Define user interface with multiple roles support
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: UserRole; // Keep for backwards compatibility
  roles: UserRole[]; // New multiple roles array
  createdAt: string;
  // Add other fields as needed
}

// User profile interface for database
export interface UserProfile {
  id: string;
  role: string | null; // Legacy single role
  roles: string[] | null; // New multiple roles
  first_name: string | null;
  last_name: string | null;
}

// Role utility functions
export const hasRole = (userRoles: string[] | null, checkRole: UserRole): boolean => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes(checkRole);
};

export const hasAnyRole = (userRoles: string[] | null, checkRoles: UserRole[]): boolean => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return checkRoles.some(role => userRoles.includes(role));
};

export const addRole = (currentRoles: string[] | null, newRole: UserRole): string[] => {
  const roles = currentRoles || [];
  if (!roles.includes(newRole)) {
    return [...roles, newRole];
  }
  return roles;
};

export const removeRole = (currentRoles: string[] | null, roleToRemove: UserRole): string[] => {
  const roles = currentRoles || [];
  return roles.filter(role => role !== roleToRemove);
};

// Get primary role (for backwards compatibility)
export const getPrimaryRole = (userRoles: string[] | null): UserRole => {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
    return UserRole.CLIENT;
  }
  
  // Prioritize admin, then masseur, then client
  if (userRoles.includes(UserRole.ADMIN)) return UserRole.ADMIN;
  if (userRoles.includes(UserRole.MASSEUR)) return UserRole.MASSEUR;
  return UserRole.CLIENT;
};

// Login input interface
export interface LoginInput {
  email: string;
  password: string;
}

// Registration input interface
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
}

// Profile update interface
export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  address?: string;
}

// Social login providers
export enum SocialProvider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE'
}

// Social login input
export interface SocialLoginInput {
  provider: SocialProvider;
  token: string;
  role: UserRole;
}

// Note: The actual AuthService implementation is no longer needed as we're handling
// authentication directly in the AuthContext 