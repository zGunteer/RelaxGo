// Define user roles
export enum UserRole {
  CLIENT = 'CLIENT',
  MASSEUR = 'MASSEUR',
  ADMIN = 'ADMIN'
}

// Define user interface
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: string;
  // Add other fields as needed
}

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