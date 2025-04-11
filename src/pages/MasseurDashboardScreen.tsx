import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, BarChart3, Calendar, Settings, Users, LogOut, Clock } from 'lucide-react';
import Map from '../components/Map';
import * as MasseurService from '../services/MasseurService';

const MasseurDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
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
  
  // Mock data for earnings
  const earnings = {
    today: 85,
    week: 430,
    month: 1650,
  };

  // Mock data for upcoming appointments
  const upcomingAppointments = [
    {
      id: 1,
      clientName: 'Alex Johnson',
      time: '14:30',
      address: '1234 Main St, Bucharest',
      price: 65,
    },
    {
      id: 2,
      clientName: 'Maria Garcia',
      time: '16:45',
      address: '567 Park Ave, Bucharest',
      price: 80,
    }
  ];

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

  // Handle clicking on an appointment
  const handleAppointmentClick = (appointmentId: number, e: React.MouseEvent) => {
    // Stop event from bubbling up to the panel or slider
    e.stopPropagation();
    // Navigate to appointment details (example)
    console.log(`Navigating to appointment ${appointmentId}`);
    // You could navigate to the appointment detail page here:
    // navigate(`/appointments/${appointmentId}`);
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

          {/* Upcoming Appointments */}
          <div className="px-5 py-2 pb-20" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Appointments</h3>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => handleAppointmentClick(appointment.id, e)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{appointment.clientName}</p>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{appointment.time}</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1 truncate max-w-[200px]">{appointment.address}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                          ${appointment.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasseurDashboardScreen; 