import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard,
  ChevronRight 
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { format } from 'date-fns';

const OrderDetailsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { masseur, date, time, address, paymentMethod, paymentMethodId, totalAmount } = location.state || {
    masseur: "Costin M. - Deep Tissue",
    date: new Date(),
    time: "14:00",
    address: "123 Main St, City",
    paymentMethod: "Visa ending in 4242",
    paymentMethodId: 1,
    totalAmount: 98
  };

  const handleConfirmBooking = () => {
    navigate('/payment', { 
      state: { 
        masseur, 
        date, 
        time, 
        address, 
        paymentMethod,
        paymentMethodId, 
        totalAmount 
      } 
    });
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-1">Massage Service</h2>
            <p className="text-gray-500">Review your booking details</p>
          </div>
          
          <div className="px-4 py-3 border-b border-gray-100 flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Date & Time</h3>
              <p className="text-gray-900">
                {typeof date === 'object' ? format(date, 'MMMM d, yyyy') : date} • {time}
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
            <button
              onClick={handleChangePaymentMethod}
              className="text-blue-600 text-sm"
            >
              Change
            </button>
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
        <button
          onClick={handleConfirmBooking}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Confirm Booking
        </button>
      </div>

      <NavBar />
    </div>
  );
};

export default OrderDetailsScreen; 