/**
 * Service to manage masseur registration status
 * Stores whether the current user is a registered masseur
 */

// Key for storing masseur status in localStorage
const MASSEUR_STATUS_KEY = 'relaxgo:masseur_status';

// Save masseur registration status
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

// Check if the user is already a registered masseur
export const isMasseurRegistered = (): boolean => {
  try {
    return localStorage.getItem(MASSEUR_STATUS_KEY) === 'registered';
  } catch (error) {
    console.error('Error checking masseur status:', error);
    return false;
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