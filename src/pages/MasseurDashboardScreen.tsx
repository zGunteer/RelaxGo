import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, BarChart3, Calendar, Settings, Users, LogOut, Clock, Check, X as XIcon } from 'lucide-react';
import Map from '../components/Map';
import * as MasseurService from '../services/MasseurService';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const MasseurDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useUser();
  const { authUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Bookings state
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Panel state with only two positions
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const panelFullHeight = 500; // Maximum panel height in pixels
  const panelMinHeight = 180; // Minimum panel height in pixels
  
  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Bucharest center
          setCurrentLocation({ lat: 44.4268, lng: 26.1025 });
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      // Fallback to Bucharest center
      setCurrentLocation({ lat: 44.4268, lng: 26.1025 });
    }
  }, []);
  
  // Fetch bookings when component mounts and when authUser changes
  useEffect(() => {
    if (authUser?.id) {
      fetchBookings();
    }
  }, [authUser?.id]);
  
  // Auto-refresh bookings every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (authUser?.id) {
        fetchBookings();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [authUser?.id]);

  // Real-time subscription for new bookings
  useEffect(() => {
    if (!authUser?.id) return;

    const channel = supabase
      .channel(`masseur-bookings-${authUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `masseuse_id=eq.${authUser.id}`,
        },
        (payload) => {
          console.log('Booking update received:', payload);
          // Refresh bookings when any booking changes
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);
  
  // Mock data for earnings (will be calculated from bookings later)
  const earnings = {
    today: 0,
    week: 0,
    month: 0,
  };

  // Fetch bookings for the current masseur
  const fetchBookings = async () => {
    if (!authUser?.id) return;
    
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          massage_type_id,
          users:customer_id (
            first_name,
            last_name
          ),
          massage_types (
            name
          )
        `)
        .eq('masseuse_id', authUser.id)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true });
        
      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }
      
      console.log('Fetched bookings:', bookings);
      
      // Transform bookings for display
      const transformedBookings = (bookings || []).map(booking => ({
        id: booking.id,
        clientName: booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : 'Unknown Client',
        time: new Date(booking.scheduled_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        date: new Date(booking.scheduled_time).toLocaleDateString(),
        address: 'Client Address', // Default since we don't have booking_address
        price: 95, // Default price since we don't have total_amount
        status: booking.status,
        massageType: booking.massage_types?.name || 'Massage',
        locationType: 'user' // Default to user location
      }));
      
      setUpcomingBookings(transformedBookings);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Confirm or reject a booking
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
        
      if (error) {
        console.error('Error updating booking status:', error);
        toast.error('Failed to update booking');
        return;
      }
      
      // Refresh bookings
      fetchBookings();
      
      if (newStatus === 'confirmed') {
        toast.success('Booking confirmed!');
      } else if (newStatus === 'declined') {
        toast.success('Booking declined');
      }
      
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking');
    }
  };

  // Modify the handlePanelDrag function to ensure it only activates on the handle itself
  const handlePanelDrag = (e: React.TouchEvent | React.MouseEvent) => {
    // Ensure we only handle drag on the panel handle itself
    const target = e.target as HTMLElement;
    const isDragHandle = target.classList.contains('panel-drag-handle');
    
    if (!isDragHandle) {
      return; // Exit if not dragging the handle specifically
    }
    
    e.stopPropagation(); // Prevent other elements from receiving this event
    
    const isTouchEvent = 'touches' in e;
    const startY = isTouchEvent ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
      moveEvent.stopPropagation();
      
      const currentY = isTouchEvent 
        ? (moveEvent as TouchEvent).touches[0].clientY 
        : (moveEvent as MouseEvent).clientY;
      
      const dragDistance = startY - currentY;
      
      // Toggle panel state based on drag direction
      if (dragDistance > 30 && !isPanelExpanded) {
        setIsPanelExpanded(true);
      } else if (dragDistance < -30 && isPanelExpanded) {
        setIsPanelExpanded(false);
      }
    };
    
    const handleEnd = (endEvent: MouseEvent | TouchEvent) => {
      endEvent.stopPropagation();
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
  };
  
  // Toggle panel on click of the handle
  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  // Complete replacement of the slider interaction function
  const handleSliderInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    if (!sliderRef.current) return;
    
    const sliderContainer = sliderRef.current;
    const sliderRect = sliderContainer.getBoundingClientRect();
    const maxSlideDistance = sliderRect.width - 60; // 60px = button width
    
    // Get initial position
    const startX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    const initialLeft = sliderRect.left;
    
    setIsDragging(true);
    
    // Use a local variable to track current position more reliably
    let currentDragPosition = 0;
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.stopPropagation();
      
      const currentX = 'touches' in moveEvent 
        ? (moveEvent as TouchEvent).touches[0].clientX 
        : (moveEvent as MouseEvent).clientX;
      
      // Calculate position relative to the slider container
      currentDragPosition = Math.max(0, Math.min(maxSlideDistance, currentX - initialLeft));
      setSliderPosition(currentDragPosition);
    };

    const handleEnd = (endEvent: MouseEvent | TouchEvent) => {
      const maxSlideDistance = sliderRect.width - 60;
      
      // If dragged far enough to trigger a state change
      if (currentDragPosition > (maxSlideDistance * 0.7)) {
        // Set to maximum position
        setSliderPosition(maxSlideDistance);
        
        // Set online after a visual pause
        setTimeout(() => {
          setIsOnline(true); // Set to online when dragged far enough right
          
          // Reset after 1 second
          setTimeout(() => {
            setIsDragging(false);
            setSliderPosition(0);
          }, 1000);
        }, 200);
      } else {
        // Not dragged far enough, reset immediately
        setIsDragging(false);
        setSliderPosition(0);
      }
      
      // Cleanup
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
  };

  // Add a separate function to handle going offline when already online
  const handleOfflineSliderInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    if (!sliderRef.current) return;
    
    const sliderContainer = sliderRef.current;
    const sliderRect = sliderContainer.getBoundingClientRect();
    const maxSlideDistance = sliderRect.width - 60; // 60px = button width
    
    // Get initial position
    const startX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    const initialLeft = sliderRect.left;
    
    setIsDragging(true);
    
    // Use a local variable to track current position more reliably
    let currentDragPosition = 0;
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.stopPropagation();
      
      const currentX = 'touches' in moveEvent 
        ? (moveEvent as TouchEvent).touches[0].clientX 
        : (moveEvent as MouseEvent).clientX;
      
      // Calculate position relative to the slider container
      currentDragPosition = Math.max(0, Math.min(maxSlideDistance, currentX - initialLeft));
      setSliderPosition(currentDragPosition);
    };

    const handleEnd = (endEvent: MouseEvent | TouchEvent) => {
      const maxSlideDistance = sliderRect.width - 60;
      
      // If dragged far enough to trigger a state change
      if (currentDragPosition > (maxSlideDistance * 0.7)) {
        // Set to maximum position
        setSliderPosition(maxSlideDistance);
        
        // Set offline after a visual pause
        setTimeout(() => {
          setIsOnline(false); // Set to offline when dragged far enough right
          
          // Reset after 1 second
          setTimeout(() => {
            setIsDragging(false);
            setSliderPosition(0);
          }, 1000);
        }, 200);
      } else {
        // Not dragged far enough, reset immediately
        setIsDragging(false);
        setSliderPosition(0);
      }
      
      // Cleanup
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
  };

  const handleLogout = () => {
    MasseurService.clearMasseurStatus();
    navigate('/home');
  };

  const toggleDeveloperMode = () => {
    MasseurService.clearMasseurStatus();
    navigate('/home');
  };

  // Handle clicking on an appointment action
  const handleAppointmentAction = (bookingId: number, action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Booking action:', action, 'for booking:', bookingId);
    
    if (action === 'confirm') {
      updateBookingStatus(bookingId, 'confirmed');
    } else if (action === 'cancel') {
      updateBookingStatus(bookingId, 'declined');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white h-full w-4/5 max-w-xs p-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col space-y-4 flex-1">
              <button className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Profile</span>
              </button>
              
              <button className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Earnings</span>
              </button>
              
              <button className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Appointments</span>
              </button>
              
              <button className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Settings</span>
              </button>
              
              <div className="h-px bg-gray-200 my-2"></div>

              <button 
                onClick={() => navigate('/home')} 
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span>Client Dashboard</span>
              </button>
              
              <button onClick={handleLogout} className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg mt-auto text-red-500">
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
              
              <button onClick={toggleDeveloperMode} className="flex items-center space-x-3 p-3 mt-2 bg-gray-100 rounded-lg text-gray-700 text-sm">
                <span>Reset Masseur Status (Dev)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-90 shadow-sm px-4 py-3 flex justify-between items-center">
        <button onClick={() => setIsMenuOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <div className={`text-white px-3 py-1 rounded-full text-sm font-medium ${isOnline ? 'bg-green-600' : 'bg-gray-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="w-6"></div> {/* Empty space for balance */}
      </div>

      {/* Map View - Removed pinpoint location marker */}
      <div className="flex-1 relative pt-14">
        {currentLocation && (
          <div className="absolute inset-0 [&_.gm-control-active]:!z-50 [&_.gm-style-zoom]:!z-50 [&_.gm-bundled-control]:!z-50 [&_.gm-bundled-control-on-bottom]:!bottom-[300px]">
            <Map 
              masseurs={[]} 
              currentLocation={currentLocation || { lat: 44.4268, lng: 26.1025 }}
              onlyShowMap={true}
              controlsPosition="bottom"
            />
          </div>
        )}
      </div>

      {/* Bottom Panel - Only two positions: expanded and collapsed */}
      <div 
        ref={panelRef}
        style={{ 
          height: isPanelExpanded ? `${panelFullHeight}px` : `${panelMinHeight}px`,
          transition: 'height 0.3s ease-out'
        }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-20 overflow-hidden"
      >
        {/* Panel resize handle - simplified for two positions */}
        <div 
          className="w-full h-10 flex items-center justify-center cursor-move panel-drag-handle"
          onMouseDown={handlePanelDrag}
          onTouchStart={handlePanelDrag}
          onClick={togglePanel}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto panel-drag-handle"></div>
        </div>

        {/* Online/Offline Slider Control - Toggle behavior with reset */}
        <div className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
          {/* Always show the slider - now isolated */}
          <div 
            ref={sliderRef} 
            className="bg-gray-200 h-14 rounded-full relative flex items-center px-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Stop clicks from bubbling up
          >
            <div 
              // Background color during drag
              className={`absolute left-0 h-full rounded-full transition-all duration-300 ${
                isDragging && !isOnline ? 'bg-green-100' : // Dragging to go online
                isDragging && isOnline ? 'bg-red-100' :   // Dragging to go offline
                'bg-gray-100' // Default state
              }`}
              style={{ width: `${sliderPosition + 60}px` }}
              onClick={(e) => e.stopPropagation()} // Stop clicks here too
            ></div>
            <div 
              className={`w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center z-10 transition-all duration-300 ${
                isDragging ? 'scale-105' : ''
              }`}
              style={{ transform: `translateX(${sliderPosition}px)` }}
              onMouseDown={isOnline ? handleOfflineSliderInteraction : handleSliderInteraction}
              onTouchStart={isOnline ? handleOfflineSliderInteraction : handleSliderInteraction}
            >
              <ArrowRight 
                // Icon color 
                className={`w-6 h-6 transition-colors duration-300 ${
                  isDragging && !isOnline ? 'text-green-600' : // Dragging to go online
                  isDragging && isOnline ? 'text-red-600' :   // Dragging to go offline
                  isOnline ? 'text-green-600' :             // Currently Online (at rest)
                  'text-gray-500' // Currently Offline (at rest)
                }`}
              />
            </div>
            <div className="ml-16 text-gray-600 font-medium z-10">
              {/* Text changes based on current state */}
              {isOnline ? 'Swipe to go offline' : 'Swipe to go online'}
            </div>
          </div>
        </div>

        {/* Scrollable content container */}
        <div 
          className="overflow-auto" 
          style={{ maxHeight: isPanelExpanded ? `${panelFullHeight - 80}px` : `${panelMinHeight - 80}px` }}
          onClick={(e) => e.stopPropagation()} // Prevent clicks from affecting the slider
        >
          {/* Summary Box */}
          <div className="px-5 py-2" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-50 rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Earnings Summary</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500 text-xs">Today</p>
                  <p className="text-xl font-bold">${earnings.today}</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500 text-xs">This Week</p>
                  <p className="text-xl font-bold">${earnings.week}</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500 text-xs">This Month</p>
                  <p className="text-xl font-bold">${earnings.month}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="px-5 py-2 pb-20" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Bookings</h3>
            {loading ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map(booking => (
                  <div 
                    key={booking.id} 
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">{booking.clientName}</p>
                        <p className="text-sm text-gray-600 mt-1">{booking.massageType}</p>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{booking.date} • {booking.time}</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1 truncate max-w-[200px]">
                          📍 {booking.address}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {booking.locationType === 'user' ? 'At client location' : 'At your location'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium mb-2">
                          ${booking.price}
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Always show buttons for debugging */}
                      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => handleAppointmentAction(booking.id, 'confirm', e)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                        disabled={booking.status !== 'pending'}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </button>
                        <button
                          onClick={(e) => handleAppointmentAction(booking.id, 'cancel', e)}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                        disabled={booking.status !== 'pending'}
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                        Decline
                        </button>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-500">No upcoming bookings</p>
                <p className="text-xs text-gray-400 mt-1">New bookings will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasseurDashboardScreen; 