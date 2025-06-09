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
  AlertCircle,
  Edit3
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

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
  
  // New state for masseur and massage options
  const [selectedMasseur, setSelectedMasseur] = useState(null);
  const [availableMassageTypes, setAvailableMassageTypes] = useState([]);
  const [selectedMassageType, setSelectedMassageType] = useState(null);
  const [userAddress, setUserAddress] = useState("123 Main St, City");
  const [showAddressEdit, setShowAddressEdit] = useState(false);
  const [editingAddress, setEditingAddress] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Location selection state
  const [locationType, setLocationType] = useState("user"); // "user" or "masseur"
  const [masseurAddress, setMasseurAddress] = useState("");

  // Check if we're returning from payment method selection
  useEffect(() => {
    const state = location.state;
    if (state) {
      if (state.selectedPaymentId) {
        setSelectedPayment(state.selectedPaymentId);
      }
      
      // Restore all preserved state data
      if (state.masseur) {
        setSelectedMasseur(state.masseur);
        fetchMassageTypes(state.masseur);
      }
      
      if (state.massageType) {
        setSelectedMassageType(state.massageType);
      }
      
      if (state.locationType) {
        setLocationType(state.locationType);
      }
      
      if (state.userAddress) {
        setUserAddress(state.userAddress);
      }
      
      if (state.masseurAddress) {
        setMasseurAddress(state.masseurAddress);
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
  
  // Fetch available massage types for the selected masseur
  const fetchMassageTypes = async (masseur) => {
    if (!masseur) {
      console.log('No masseur provided to fetchMassageTypes');
      return;
    }
    
    setLoading(true);
    const masseurId = masseur.id || masseur.masseuse_id;
    console.log('Fetching massage types for masseur ID:', masseurId);
    
    try {
      // Get masseur's data including their massage types and address
      const { data: masseurData, error: masseurError } = await supabase
        .from('masseuses')
        .select('massage_types, address')
        .eq('masseuse_id', masseurId)
        .single();
        
      console.log('Masseur data from database:', masseurData);
      console.log('Masseur query error:', masseurError);
        
      if (masseurError) {
        console.error('Error fetching masseur data:', masseurError);
        setAvailableMassageTypes([]);
        setLoading(false);
        return;
      }
      
      // Set masseur address
      if (masseurData?.address) {
        setMasseurAddress(masseurData.address);
        console.log('Set masseur address:', masseurData.address);
      }
      
      // Get the massage types from the masseur's massage_types array
      const masseurTypeNames = masseurData?.massage_types || [];
      console.log('Masseur massage_types from database:', masseurTypeNames);
      
      if (masseurTypeNames.length === 0) {
        console.log('No massage types found in masseur record');
        setAvailableMassageTypes([]);
        setLoading(false);
        return;
      }
      
      // Get details for these massage types from the massage_types table
      const { data: typeDetails, error: typesError } = await supabase
        .from('massage_types')
        .select('*')
        .in('name', masseurTypeNames);
        
      console.log('Massage type details from database:', typeDetails);
      console.log('Massage types query error:', typesError);
        
      if (typesError) {
        console.error('Error fetching massage type details:', typesError);
        setAvailableMassageTypes([]);
        setLoading(false);
        return;
      }
      
      // Check for custom pricing if masseuse_massage_types table exists
      let customPricing = {};
      try {
        const { data: customPrices } = await supabase
          .from('masseuse_massage_types')
          .select('massage_type_id, custom_price')
          .eq('masseuse_id', masseurId);
          
        console.log('Custom pricing data:', customPrices);
          
        if (customPrices) {
          customPricing = customPrices.reduce((acc, item) => {
            acc[item.massage_type_id] = item.custom_price;
            return acc;
          }, {});
        }
      } catch (error) {
        console.log('No custom pricing table or data found, using base prices');
      }
      
      // Combine the data
      const availableTypes = (typeDetails || []).map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        price: customPricing[type.id] || type.base_price || 75
      }));
      
      console.log('Final available massage types:', availableTypes);
      setAvailableMassageTypes(availableTypes);
      
    } catch (error) {
      console.error('Error fetching massage types:', error);
      setAvailableMassageTypes([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle address update
  const handleAddressUpdate = () => {
    if (editingAddress.trim()) {
      setUserAddress(editingAddress.trim());
      setShowAddressEdit(false);
      setEditingAddress("");
      toast.success('Address updated successfully');
    }
  };
  
  const handleEditAddress = () => {
    setEditingAddress(userAddress);
    setShowAddressEdit(true);
  };
  
  const cancelAddressEdit = () => {
    setShowAddressEdit(false);
    setEditingAddress("");
  };

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
    if (!selectedDate || !selectedTime || !selectedMasseur || !selectedMassageType) {
      toast.error('Please complete all selections before proceeding');
      return;
    }
    
    // Pass all the necessary data to the order details screen
    navigate('/order-details', {
      state: {
        masseur: `${selectedMasseur.name} - ${selectedMassageType.name}`,
        masseurId: selectedMasseur.id,
        massageType: selectedMassageType,
        date: selectedDate.toISOString(),
        time: selectedTime,
        address: locationType === "user" ? userAddress : masseurAddress,
        locationType: locationType,
        paymentMethod: getSelectedPaymentMethod(),
        paymentMethodId: selectedPayment,
        totalAmount: selectedMassageType.price || 75
      }
    });
  };

  const handleChangePaymentMethod = () => {
    navigate('/payment-methods', { 
      state: { 
        returnTo: '/booking',
        selectedPaymentId: selectedPayment,
        date: selectedDate ? selectedDate.toISOString() : null,
        time: selectedTime,
        masseur: selectedMasseur, // Preserve masseur data
        massageType: selectedMassageType,
        locationType: locationType,
        userAddress: userAddress,
        masseurAddress: masseurAddress
      } 
    });
  };

  const isButtonDisabled = !selectedMassageType || !selectedDate || !selectedTime || !selectedPayment;
  
  // Calculate current total price
  const getCurrentTotal = () => {
    return selectedMassageType ? selectedMassageType.price : 0;
  };

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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Choose Location</h2>
          
          {/* Location Type Selection */}
          <div className="space-y-3 mb-4">
            {/* User's Address Option */}
            <div 
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                locationType === "user" 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setLocationType("user")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    locationType === "user" ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {locationType === "user" && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">At your location</div>
                    <div className="text-sm text-gray-500">Masseur comes to you</div>
                  </div>
                </div>
                {locationType === "user" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAddress();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
              
              {locationType === "user" && !showAddressEdit && (
                <div className="mt-2 ml-7 text-sm text-gray-600">
                  📍 {userAddress}
                </div>
              )}
              
              {locationType === "user" && showAddressEdit && (
                <div className="mt-3 ml-7 space-y-3">
                  <input
                    type="text"
                    value={editingAddress}
                    onChange={(e) => setEditingAddress(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your address"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddressUpdate}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Update
                    </button>
                    <button
                      onClick={cancelAddressEdit}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Masseur's Address Option */}
            <div 
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                locationType === "masseur" 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setLocationType("masseur")}
            >
          <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  locationType === "masseur" ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {locationType === "masseur" && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">At masseur's location</div>
                  <div className="text-sm text-gray-500">You visit the masseur</div>
                </div>
              </div>
              
              {locationType === "masseur" && masseurAddress && (
                <div className="mt-2 ml-7 text-sm text-gray-600">
                  📍 {masseurAddress}
                </div>
              )}
              
              {locationType === "masseur" && !masseurAddress && (
                <div className="mt-2 ml-7 text-sm text-gray-500">
                  Address will be provided after booking confirmation
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Massage Type Selection */}
        <div className="bg-white p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Choose Massage Type</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading massage options...</span>
            </div>
          ) : availableMassageTypes.length > 0 ? (
            <div className="space-y-3">
              {availableMassageTypes.map((massageType) => (
                <button
                  key={massageType.id}
                  onClick={() => setSelectedMassageType(massageType)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedMassageType?.id === massageType.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{massageType.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{massageType.description}</div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 ml-4">
                      ${massageType.price}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No massage types available for this masseur.</p>
              <p className="text-sm mt-1">Please try selecting a different masseur.</p>
            </div>
          )}
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
          <span className="text-lg font-semibold text-gray-900">
            ${getCurrentTotal().toFixed(2)}
          </span>
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
