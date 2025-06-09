import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, Calendar, MapPin, Star, ChevronRight, 
  Clock as ClockIcon, Calendar as CalendarIcon, Loader2
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

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
            status === 'upcoming' || status === 'confirmed' || status === 'pending'
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {status === 'upcoming' || status === 'confirmed' ? 'Upcoming' : status === 'pending' ? 'Pending' : 'Completed'}
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
  const { authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');
    if (view === 'past') {
      setActiveTab('past');
    }
  }, [location]);
  
  useEffect(() => {
    if (authUser) {
      fetchBookings();
    }
  }, [authUser]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // 1. Fetch upcoming bookings: confirmed or pending, and in the future
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          id, scheduled_time, status,
          masseuse:masseuse_id (first_name, last_name),
          massage_type:massage_type_id (name, base_price),
          reviews (rating)
        `)
        .eq('customer_id', authUser.id)
        .in('status', ['confirmed', 'pending'])
        .gte('scheduled_time', now)
        .order('scheduled_time', { ascending: true });

      if (upcomingError) throw upcomingError;

      // 2. Fetch all other bookings for the user to determine the "past" list
      const { data: allBookingsData, error: allBookingsError } = await supabase
        .from('bookings')
        .select(`
          id, scheduled_time, status,
          masseuse:masseuse_id (first_name, last_name),
          massage_type:massage_type_id (name, base_price),
          reviews (rating)
        `)
        .eq('customer_id', authUser.id)
        .order('scheduled_time', { ascending: false });

      if (allBookingsError) throw allBookingsError;
  
      const transformBooking = (booking) => ({
        id: booking.id,
        masseurName: `${booking.masseuse.first_name || ''} ${booking.masseuse.last_name || ''}`.trim(),
        date: format(new Date(booking.scheduled_time), 'MMMM d, yyyy'),
        time: format(new Date(booking.scheduled_time), 'p'),
        location: 'Client Address', // Placeholder, needs address in bookings table
        status: booking.status,
        rating: (booking.reviews && booking.reviews.length > 0) ? booking.reviews[0].rating.toString() : null,
        specialty: booking.massage_type.name,
        price: booking.massage_type.base_price,
      });

      const upcomingTransformed = upcomingData.map(transformBooking);
      const upcomingIds = new Set(upcomingTransformed.map(b => b.id));

      // A booking is "past" if it's not in the upcoming list
      const pastTransformed = allBookingsData
        .filter(booking => !upcomingIds.has(booking.id))
        .map(transformBooking);
      
      setUpcomingBookings(upcomingTransformed);
      setPastBookings(pastTransformed);

    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookingClick = (booking) => {
    if (booking.status === 'confirmed') {
      navigate('/tracking', { state: { bookingId: booking.id } });
    } else if (booking.status === 'completed' || booking.status === 'cancelled') {
      navigate(`/rating/${booking.id}`);
    } else {
      // For pending bookings, maybe navigate to order details
      // Or just don't do anything
    }
  };

  const renderContent = (bookings) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <div className="text-center p-10 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No bookings here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            {...booking}
            onClick={() => handleBookingClick(booking)}
          />
        ))}
      </div>
    );
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
            {renderContent(upcomingBookings)}
          </TabsContent>
          
          <TabsContent value="past" className="mt-0">
            {renderContent(pastBookings)}
          </TabsContent>
        </Tabs>
      </div>
      
      <NavBar />
    </div>
  );
};

export default BookingsScreen; 