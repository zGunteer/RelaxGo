import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Plus, X, Check } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';

const PaymentMethod = ({ icon: Icon, title, subtitle, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-4 mb-3 rounded-lg border ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}
  >
    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
      isSelected ? 'bg-blue-100' : 'bg-gray-100'
    }`}>
      <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
    </div>
    <div className="ml-3 text-left flex-1">
      <div className="font-medium text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
    {isSelected && (
      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
        <Check className="h-4 w-4 text-white" />
      </div>
    )}
  </button>
);

const NewCardForm = ({ onCancel, onSave }) => {
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add validation here
    if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
      toast.error('Please fill in all fields');
      return;
    }
    onSave(cardDetails);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Add New Card</h3>
        <button onClick={onCancel} className="text-gray-500">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
          <input
            type="text"
            name="number"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.number}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={cardDetails.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <input
              type="text"
              name="expiry"
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <input
              type="text"
              name="cvv"
              placeholder="123"
              value={cardDetails.cvv}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Card
        </button>
      </form>
    </div>
  );
};

const PaymentMethodsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { returnTo, selectedPaymentId, ...otherState } = location.state || {};
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cards, setCards] = useState([
    { id: 1, type: 'visa', last4: '4242', name: 'Visa ending in 4242' },
    { id: 2, type: 'mastercard', last4: '8888', name: 'Mastercard ending in 8888' }
  ]);

  // Set the selected payment method from state if available
  useEffect(() => {
    // Initialize with default selection or from passed state
    if (selectedPaymentId) {
      setSelectedMethod(selectedPaymentId);
    } else {
      setSelectedMethod(1); // Default to first card
    }
  }, [selectedPaymentId]);

  const handleSaveCard = (cardDetails) => {
    // Create a new card object with a unique ID
    const newId = cards.length + 1;
    const newCard = {
      id: newId,
      type: 'visa', // You would determine card type based on the number
      last4: cardDetails.number.slice(-4),
      name: `Card ending in ${cardDetails.number.slice(-4)}`,
    };
    
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    setSelectedMethod(newId);
    setShowAddCard(false);
    toast.success('New card added successfully');
  };

  const handleSelectPaymentMethod = (id) => {
    setSelectedMethod(id);
  };

  const handleSaveSelection = () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    const selectedCard = cards.find(card => card.id === selectedMethod) || 
                        { name: selectedMethod === 'google' ? 'Google Pay' : 'Apple Pay' };
    
    if (returnTo === '/order-details') {
      navigate(returnTo, { 
        state: { 
          ...otherState,
          paymentMethod: selectedCard.name,
          paymentMethodId: selectedMethod
        } 
      });
    } else if (returnTo === '/booking') {
      navigate(returnTo, {
        state: {
          ...otherState,
          selectedPaymentId: selectedMethod
        }
      });
    } else {
      navigate(-1, {
        state: {
          ...otherState,
          selectedPaymentId: selectedMethod
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Payment Methods</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {showAddCard ? (
          <NewCardForm 
            onCancel={() => setShowAddCard(false)}
            onSave={handleSaveCard}
          />
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3">CREDIT OR DEBIT CARDS</h2>
              
              {cards.map(card => (
                <PaymentMethod
                  key={card.id}
                  icon={CreditCard}
                  title={card.name}
                  subtitle={card.type === 'visa' ? 'Visa' : 'Mastercard'}
                  isSelected={selectedMethod === card.id}
                  onClick={() => handleSelectPaymentMethod(card.id)}
                />
              ))}
              
              <button 
                onClick={() => setShowAddCard(true)}
                className="w-full flex items-center justify-center p-3 text-blue-600 border border-dashed border-blue-300 rounded-lg mb-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Add a credit or debit card</span>
              </button>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">DIGITAL WALLETS</h2>
              
              <PaymentMethod
                icon={Smartphone}
                title="Google Pay"
                subtitle="Pay using Google Wallet"
                isSelected={selectedMethod === 'google'}
                onClick={() => handleSelectPaymentMethod('google')}
              />
              
              <PaymentMethod
                icon={Smartphone}
                title="Apple Pay"
                subtitle="Pay using Apple Wallet"
                isSelected={selectedMethod === 'apple'}
                onClick={() => handleSelectPaymentMethod('apple')}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom action */}
      {!showAddCard && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
          <button
            onClick={handleSaveSelection}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      )}

      <NavBar />
    </div>
  );
};

export default PaymentMethodsScreen; 