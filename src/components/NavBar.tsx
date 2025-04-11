import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/bookings') {
      return location.pathname === '/bookings';
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center">
      <button
        onClick={() => navigate('/home')}
        className={`flex flex-col items-center p-2 rounded-lg ${
          isActive('/home') ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Home</span>
      </button>

      <button
        onClick={() => navigate('/bookings?view=past')}
        className={`flex flex-col items-center p-2 rounded-lg ${
          isActive('/bookings') ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        <Calendar className="h-6 w-6" />
        <span className="text-xs mt-1">Bookings</span>
      </button>

      <button
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center p-2 rounded-lg ${
          isActive('/profile') ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Profile</span>
      </button>
    </nav>
  );
};

export default NavBar;
