import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';

const TimeSlot = ({ time, isAvailable, isSelected, onClick }) => (
  <button
    onClick={onClick}
    disabled={!isAvailable}
    className={`p-2 rounded-lg text-sm ${
      isSelected 
        ? 'bg-blue-600 text-white' 
        : isAvailable 
          ? 'bg-white text-gray-900 hover:bg-gray-50' 
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
    }`}
  >
    {time}
  </button>
);

const CalendarDay = ({ date, isSelected, isToday, isSameMonth, onClick }) => (
  <button
    onClick={onClick}
    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
      isSelected 
        ? 'bg-blue-600 text-white' 
        : isToday 
          ? 'bg-blue-100 text-blue-600' 
          : isSameMonth 
            ? 'text-gray-900' 
            : 'text-gray-400'
    }`}
  >
    {format(date, 'd')}
  </button>
);

const BookingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showTimeSelection, setShowTimeSelection] = useState(false);

  // Check if we're returning from payment method selection
  useEffect(() => {
    const state = location.state;
    if (state) {
      if (state.selectedPaymentId) {
        setSelectedPayment(state.selectedPaymentId);
      }
      
      // Restore date and time if they were saved in state
      if (state.date) {
        setSelectedDate(new Date(state.date));
        setShowTimeSelection(true);
      }
      
      if (state.time) {
        setSelectedTime(state.time);
      }
    }
  }, [location]);

  const timeSlots = [
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: false },
    { time: '12:00', available: true },
    { time: '13:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: false },
    { time: '16:00', available: true },
  ];

  const paymentMethods = [
    { id: 1, type: 'card', name: 'Visa ending in 4242' },
    { id: 2, type: 'card', name: 'Mastercard ending in 8888' },
    { id: 3, type: 'google', name: 'Google Pay' },
    { id: 4, type: 'apple', name: 'Apple Pay' },
  ];

  const getSelectedPaymentMethod = () => {
    if (!selectedPayment) return "Select Payment Method";
    const method = paymentMethods.find(m => m.id === selectedPayment);
    return method ? method.name : "Select Payment Method";
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowTimeSelection(true);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleReviewOrder = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }
    
    navigate('/order-details', {
      state: {
        masseur: "Costin M. - Deep Tissue",
        date: selectedDate,
        time: selectedTime,
        address: "123 Main St, City",
        paymentMethod: getSelectedPaymentMethod(),
        paymentMethodId: selectedPayment,
        totalAmount: 98
      }
    });
  };

  const handleChangePaymentMethod = () => {
    navigate('/payment-methods', { 
      state: { 
        returnTo: '/booking',
        selectedPaymentId: selectedPayment,
        date: selectedDate ? selectedDate.toISOString() : null,
        time: selectedTime
      } 
    });
  };

  const isButtonDisabled = !selectedDate || !selectedTime || !selectedPayment;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 rotate-180" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Book Massage</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Location Section */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-900">123 Main St, City</span>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Select Date</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => (
              <CalendarDay
                key={date.toString()}
                date={date}
                isSelected={selectedDate && isSameDay(date, selectedDate)}
                isToday={isToday(date)}
                isSameMonth={isSameMonth(date, currentMonth)}
                onClick={() => handleDateSelect(date)}
              />
            ))}
          </div>
        </div>

        {/* Time Selection */}
        {showTimeSelection && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Time</h2>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <TimeSlot
                  key={slot.time}
                  time={slot.time}
                  isAvailable={slot.available}
                  isSelected={selectedTime === slot.time}
                  onClick={() => handleTimeSelect(slot.time)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment Method Dropdown */}
        <div className="bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
          </div>
          <div className="relative">
            <button
              onClick={handleChangePaymentMethod}
              className="w-full p-4 rounded-lg border border-gray-200 flex items-center justify-between bg-white"
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-gray-900">{getSelectedPaymentMethod()}</span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">Total</span>
          <span className="text-lg font-semibold text-gray-900">$98.00</span>
        </div>
        <button
          onClick={handleReviewOrder}
          disabled={isButtonDisabled}
          className={`w-full py-3 rounded-lg transition-colors ${
            isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Review Order
        </button>
      </div>

      {/* NavBar with padding to avoid overlap with bottom bar */}
      <div className="pb-24">
        <NavBar />
      </div>
    </div>
  );
};

export default BookingScreen;
