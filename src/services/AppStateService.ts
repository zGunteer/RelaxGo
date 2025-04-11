/**
 * Service to manage app state persistence
 * Stores the current route in localStorage so the app can resume where it left off
 */

// Keys for storing app state in localStorage
const CURRENT_ROUTE_KEY = 'relaxgo:current_route';
const LAST_ACTIVE_KEY = 'relaxgo:last_active';
const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

// Save the current route when navigating
export const saveCurrentRoute = (path: string): void => {
  try {
    // Skip saving certain routes that shouldn't be persisted
    if (
      path === '/splash' || 
      path === '/auth' ||
      path === '/' ||
      path.includes('masseur-status') // Don't persist status screens
    ) {
      return;
    }
    
    localStorage.setItem(CURRENT_ROUTE_KEY, path);
    updateLastActiveTimestamp();
  } catch (error) {
    console.error('Error saving current route:', error);
  }
};

// Update the timestamp of the last user activity
export const updateLastActiveTimestamp = (): void => {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
  }
};

// Check if the app has been inactive for longer than the threshold
export const hasBeenInactiveTooLong = (): boolean => {
  try {
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!lastActiveStr) {
      return true; // If no timestamp exists, assume inactive too long
    }
    
    const lastActive = parseInt(lastActiveStr, 10);
    const currentTime = Date.now();
    const inactiveTime = currentTime - lastActive;
    
    return inactiveTime > INACTIVITY_THRESHOLD;
  } catch (error) {
    console.error('Error checking inactivity:', error);
    return true; // Default to true on error
  }
};

// Get the last route the user was on
export const getLastRoute = (): string | null => {
  try {
    // If user has been inactive too long, don't restore previous route
    if (hasBeenInactiveTooLong()) {
      return '/home'; // Default to home screen after long inactivity
    }
    return localStorage.getItem(CURRENT_ROUTE_KEY);
  } catch (error) {
    console.error('Error getting last route:', error);
    return null;
  }
};

// Clear the saved route (useful for logout)
export const clearSavedRoute = (): void => {
  try {
    localStorage.removeItem(CURRENT_ROUTE_KEY);
  } catch (error) {
    console.error('Error clearing saved route:', error);
  }
}; 