import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";
import { saveCurrentRoute, updateLastActiveTimestamp } from "@/services/AppStateService";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SplashScreen from "./pages/SplashScreen";
import AuthScreen from "./pages/AuthScreen";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import HomeScreen from "./pages/HomeScreen";
import BookingScreen from "./pages/BookingScreen";
import PaymentScreen from "./pages/PaymentScreen";
import TrackingScreen from "./pages/TrackingScreen";
import RatingScreen from "./pages/RatingScreen";
import BookingsScreen from './pages/BookingsScreen';
import ProfileScreen from './pages/ProfileScreen';
import PersonalInfoScreen from './pages/PersonalInfoScreen';
import PaymentMethodsScreen from './pages/PaymentMethodsScreen';
import OrderDetailsScreen from './pages/OrderDetailsScreen';
import MasseurSignupScreen from './pages/MasseurSignupScreen';
import MasseurDocumentsScreen from './pages/MasseurDocumentsScreen';
import MasseurStatusScreen from './pages/MasseurStatusScreen';
import MasseurDashboardScreen from './pages/MasseurDashboardScreen';
import UnauthorizedScreen from "./pages/UnauthorizedScreen";

const queryClient = new QueryClient();

// Component to handle route tracking and app state restoration
const RouteTracker = () => {
  const location = useLocation();
  
  // Save the current route whenever it changes
  useEffect(() => {
    // Update the timestamp and save route on every navigation
    saveCurrentRoute(location.pathname + location.search);
    
    // Add event listeners to track app activity
    const handleActivity = () => {
      updateLastActiveTimestamp();
    };
    
    // Track user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    
    // Also update the timestamp when the app becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        updateLastActiveTimestamp();
      }
    });
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleActivity);
    };
  }, [location]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UserProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteTracker />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedScreen />} />
              
              {/* All routes are now public */}
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/profile/personal-info" element={<PersonalInfoScreen />} />
              <Route path="/booking" element={<BookingScreen />} />
              <Route path="/payment" element={<PaymentScreen />} />
              <Route path="/tracking" element={<TrackingScreen />} />
              <Route path="/rating" element={<RatingScreen />} />
              <Route path="/bookings" element={<BookingsScreen />} />
              <Route path="/payment-methods" element={<PaymentMethodsScreen />} />
              <Route path="/order-details" element={<OrderDetailsScreen />} />
              <Route path="/masseur-signup" element={<MasseurSignupScreen />} />
              <Route path="/masseur-documents" element={<MasseurDocumentsScreen />} />
              <Route path="/masseur-status" element={<MasseurStatusScreen />} />
              <Route path="/masseur-dashboard" element={<MasseurDashboardScreen />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
