import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const OrderDetailsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser } = useAuth();
  
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string>('draft'); // draft, pending, confirmed, declined
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    masseur, 
    massageType, 
    date: dateProp, 
    time, 
    address, 
    locationType,
    paymentMethod, 
    paymentMethodId, 
    totalAmount 
  } = location.state || {
    masseur: "Costin M. - Deep Tissue",
    massageType: { id: 1, name: 'Deep Tissue', price: 95 },
    date: new Date(),
    time: "14:00",
    address: "123 Main St, City",
    locationType: "user",
    paymentMethod: "Visa ending in 4242",
    paymentMethodId: 1,
    totalAmount: 98
  };

  // Ensure `date` is always a valid Date object for consistent use
  const date = typeof dateProp === 'string' ? new Date(dateProp) : dateProp;

  // Listen for booking status changes
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('Booking status updated:', payload);
          if (payload.new?.status) {
            setBookingStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const handleConfirmBooking = async () => {
    if (!authUser) {
      setError('You must be logged in to make a booking');
      return;
    }

    setIsCreatingBooking(true);
    setError(null);

    try {
      const masseurId = location.state?.masseurId;

      if (!masseurId) {
        throw new Error("Masseur ID is missing. Please go back and select a masseur.");
      }

      // Create the booking by combining the date and time correctly
      const dateString = format(date, 'yyyy-MM-dd');
      const scheduledDateTime = new Date(`${dateString}T${time}`);

      if (isNaN(scheduledDateTime.getTime())) {
        throw new RangeError("Invalid date");
      }
      
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: authUser.id,
          masseuse_id: masseurId,
          massage_type_id: massageType.id,
          scheduled_time: scheduledDateTime.toISOString(),
          duration_minutes: 90, // Default duration - you can make this configurable
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      setBookingId(newBooking.id);
      setBookingStatus('pending');
      console.log('Booking created:', newBooking);

    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleReviseOrder = () => {
    navigate('/booking', { 
      state: { 
        selectedPaymentId: paymentMethodId
      } 
    });
  };

  const handleChangePaymentMethod = () => {
    navigate('/payment-methods', { 
      state: { 
        returnTo: '/order-details', 
        selectedPaymentId: paymentMethodId,
        ...location.state 
      } 
    });
  };

  const handleGoToTracking = () => {
    navigate('/tracking', {
      state: {
        bookingId,
        masseur,
        massageType,
        date,
        time,
        address
      }
    });
  };

  const renderBookingStatus = () => {
    switch (bookingStatus) {
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">Waiting for Confirmation</h3>
                <p className="text-yellow-700 text-sm">The masseur is reviewing your booking request...</p>
              </div>
            </div>
          </div>
        );
      case 'confirmed':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-green-800">Booking Confirmed!</h3>
                  <p className="text-green-700 text-sm">Your massage has been confirmed by the masseur</p>
                </div>
              </div>
              <button
                onClick={handleGoToTracking}
                className="text-green-600 text-sm font-medium hover:text-green-700"
              >
                Track Order
              </button>
            </div>
          </div>
        );
      case 'declined':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="font-medium text-red-800">Booking Declined</h3>
                <p className="text-red-700 text-sm">Unfortunately, the masseur is not available at this time</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={handleReviseOrder}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Order Details</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto pb-28">
        {/* Booking Status */}
        {renderBookingStatus()}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-1">Massage Service</h2>
            <p className="text-gray-500">
              {bookingStatus === 'draft' ? 'Review your booking details' : 'Your booking details'}
            </p>
          </div>
          
          <div className="px-4 py-3 border-b border-gray-100 flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Date & Time</h3>
              <p className="text-gray-900">
                {format(date, 'MMMM d, yyyy')} • {time}
              </p>
            </div>
          </div>
          
          <div className="px-4 py-3 border-b border-gray-100 flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Location</h3>
              <p className="text-gray-900">{address}</p>
            </div>
          </div>
          
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Payment Method</h3>
                <p className="text-gray-900">{paymentMethod}</p>
              </div>
            </div>
            {bookingStatus === 'draft' && (
            <button
              onClick={handleChangePaymentMethod}
              className="text-blue-600 text-sm"
            >
              Change
            </button>
            )}
          </div>
          
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Masseur</h3>
                <p className="text-gray-900">{masseur}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Massage Service</span>
              <span className="text-gray-900">$95.00</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Service Fee</span>
              <span className="text-gray-900">$3.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-medium text-gray-900">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        {bookingStatus === 'draft' && (
        <button
          onClick={handleConfirmBooking}
            disabled={isCreatingBooking}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
            {isCreatingBooking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        )}
        {bookingStatus === 'confirmed' && (
          <button
            onClick={handleGoToTracking}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Track Your Massage
          </button>
        )}
        {bookingStatus === 'declined' && (
          <button
            onClick={() => navigate('/booking')}
            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Find Another Masseur
        </button>
        )}
      </div>

      <NavBar />
    </div>
  );
};

export default OrderDetailsScreen; 