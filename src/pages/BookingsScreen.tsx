import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, Calendar, MapPin, Star, ChevronRight, 
  Clock as ClockIcon, Calendar as CalendarIcon
} from 'lucide-react';
import NavBar from '@/components/NavBar';

const BookingCard = ({ 
  masseurName, 
  date, 
  time, 
  location, 
  status, 
  rating, 
  specialty,
  price,
  onClick 
}) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-xl p-4 shadow-sm mb-3 active:bg-gray-50 transition-colors"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <h3 className="font-medium text-gray-900">{masseurName}</h3>
          {rating && (
            <div className="flex items-center ml-2">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="text-sm text-gray-500">{rating}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{date}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>{time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{location}</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">${price}</span>
          <span className={`text-sm px-2 py-1 rounded-full ${
            status === 'upcoming' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {status === 'upcoming' ? 'Upcoming' : 'Completed'}
          </span>
        </div>
      </div>
      
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  </div>
);

const BookingsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Check if we should display the past tab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');
    if (view === 'past') {
      setActiveTab('past');
    }
  }, [location]);
  
  const upcomingBookings = [
    {
      masseurName: "Costin M.",
      date: "Today",
      time: "2:30 PM",
      location: "Strada Victoriei 123",
      status: "upcoming",
      rating: "4.9",
      specialty: "Deep Tissue",
      price: 95
    },
    {
      masseurName: "Elena B.",
      date: "Tomorrow",
      time: "11:00 AM",
      location: "Bulevardul Unirii 45",
      status: "upcoming",
      rating: "4.7",
      specialty: "Masaj Thai",
      price: 85
    }
  ];
  
  const pastBookings = [
    {
      masseurName: "Mihai B.",
      date: "March 15, 2024",
      time: "3:00 PM",
      location: "Strada Lipscani 78",
      status: "completed",
      rating: "4.8",
      specialty: "Relaxare",
      price: 80
    },
    {
      masseurName: "Teodora P.",
      date: "March 10, 2024",
      time: "1:30 PM",
      location: "Calea Victoriei 234",
      status: "completed",
      rating: "4.6",
      specialty: "Recuperare Sportivă",
      price: 90
    }
  ];
  
  const handleBookingClick = (booking) => {
    if (booking.status === 'upcoming') {
      navigate('/tracking');
    } else {
      navigate('/rating');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">My Bookings</h1>
      </div>
      
      <div className="flex-1 p-4">
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="upcoming" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Past
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-0">
            <div className="space-y-3">
              {upcomingBookings.map((booking, index) => (
                <BookingCard 
                  key={index} 
                  {...booking} 
                  onClick={() => handleBookingClick(booking)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="past" className="mt-0">
            <div className="space-y-3">
              {pastBookings.map((booking, index) => (
                <BookingCard 
                  key={index} 
                  {...booking} 
                  onClick={() => handleBookingClick(booking)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <NavBar />
    </div>
  );
};

export default BookingsScreen; 