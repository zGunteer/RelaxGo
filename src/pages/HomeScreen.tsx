import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, MapPin, List, Info, UserCircle, Briefcase, CreditCard, Lock, Calendar } from 'lucide-react';
import NavBar from '../components/NavBar';
import Map from '../components/Map';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { isMasseurRegistered } from '@/services/MasseurService';

// Add Popover imports
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

const massageTypes = [
  { 
    id: 'all',
    name: 'All',
    description: 'View all available massage types from our professional masseurs.',
    imageUrl: '/images/SwedishMassage.jpeg'
  },
  { 
    id: 'deep-tissue',
    name: 'Deep Tissue', 
    description: 'Targets deeper layers of muscle and connective tissue. Helpful for chronic pain, limited mobility, and recovery from injuries.',
    imageUrl: '/images/DeepTissueMassage.jpeg'
  },
  { 
    id: 'swedish',
    name: 'Swedish', 
    description: 'A gentle type of full-body massage ideal for relaxation, stress relief, and releasing muscle knots.',
    imageUrl: '/images/SwedishMassage.jpeg'
  },
  { 
    id: 'sports',
    name: 'Sports', 
    description: 'Focuses on preventing and treating injuries in athletes, enhancing athletic performance and physical function.',
    imageUrl: '/images/SportsMassage.jpeg'
  },
  { 
    id: 'shiatsu',
    name: 'Shiatsu', 
    description: 'Japanese massage using finger pressure on specific body points to promote energy flow and relieve tension.',
    imageUrl: '/images/ShiatsuMassage.jpeg'
  },
  { 
    id: 'aromatherapy',
    name: 'Aromatherapy', 
    description: 'Combines soft massage techniques with essential oils to enhance physical and mental well-being.',
    imageUrl: '/images/AromatherapyMassage.jpeg'
  },
  { 
    id: 'lymphatic',
    name: 'Lymphatic', 
    description: 'Gentle technique that helps reduce swelling and improve circulation of lymphatic fluid throughout the body.',
    imageUrl: '/images/LymphaticMassage.jpeg'
  }
];

interface MassageTypeButtonProps {
  type: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const MassageTypeButton: React.FC<MassageTypeButtonProps> = ({ 
  type, 
  isSelected, 
  onClick 
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <button
          onClick={onClick}
          className={cn(
            type.id === 'all' 
              ? "py-2 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              : "py-2 px-4 rounded-l-full text-sm font-medium transition-colors whitespace-nowrap",
            isSelected
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {type.name}
        </button>
        {type.id !== 'all' && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "h-full py-2 -ml-2 rounded-r-full flex items-center justify-center transition-colors",
                  isSelected 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-white-700 hover:bg-white-200"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <span className={cn(
                  "flex items-center justify-center h-4 w-4 rounded-full mr-2",
                  isSelected ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600"
                )}>
                  <Info size={10} />
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-72 p-3 text-sm"
              sideOffset={2}
              align="start"
              alignOffset={-40}
            >
              <div className="overflow-hidden rounded-md mb-2">
                <img 
                  src={type.imageUrl} 
                  alt={type.name} 
                  className="w-full h-36 object-cover" 
                  onError={(e) => {
                    e.currentTarget.src = '/images/massage-placeholder.jpg';
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>
              <h4 className="font-medium mb-1">{type.name}</h4>
              <p className="text-gray-600">{type.description}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

const exampleMasseurs = [
  {
    name: "Alex Johnson",
    rating: "4.9",
    specialty: "Deep Tissue",
    price: 89,
    distance: "1.2 miles",
    available: true,
    position: { lat: 44.4458, lng: 26.0936 }
  },
  {
    name: "Maria Garcia",
    rating: "4.8",
    specialty: "Swedish",
    price: 75,
    distance: "0.8 miles",
    available: true,
    position: { lat: 44.4378, lng: 26.1026 }
  },
  {
    name: "Daniel Kim",
    rating: "4.7",
    specialty: "Sports",
    price: 95,
    distance: "1.5 miles",
    available: false,
    position: { lat: 44.4268, lng: 26.1225 }
  },
  {
    name: "Sophie Chen",
    rating: "4.9",
    specialty: "Deep Tissue",
    price: 85,
    distance: "0.9 miles",
    available: true,
    position: { lat: 44.4328, lng: 26.0956 }
  },
  {
    name: "Marco Rossi",
    rating: "4.6",
    specialty: "Swedish",
    price: 80,
    distance: "1.1 miles",
    available: true,
    position: { lat: 44.4418, lng: 26.1126 }
  },
  {
    name: "Yuki Tanaka",
    rating: "5.0",
    specialty: "Shiatsu",
    price: 95,
    distance: "1.6 miles",
    available: true,
    position: { lat: 44.4498, lng: 26.0926 }
  },
  {
    name: "Emma Laurent",
    rating: "4.8",
    specialty: "Aromatherapy",
    price: 90,
    distance: "1.0 miles",
    available: false,
    position: { lat: 44.4338, lng: 26.1146 }
  },
  {
    name: "Michael Stevens",
    rating: "4.9",
    specialty: "Lymphatic",
    price: 100,
    distance: "1.3 miles",
    available: true,
    position: { lat: 44.4358, lng: 26.0986 }
  }
];

const HomeScreen = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedMassageType, setSelectedMassageType] = useState("all");
  const typeScrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { userInfo } = useUser();

  const scrollLeft = () => {
    if (typeScrollRef.current) {
      typeScrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (typeScrollRef.current) {
      typeScrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  // Filter masseurs based on selected type
  const filteredMasseurs = selectedMassageType === "all" 
    ? exampleMasseurs
    : exampleMasseurs.filter(
        masseur => masseur.specialty.toLowerCase() === 
          massageTypes.find(type => type.id === selectedMassageType)?.name.toLowerCase()
      );

  const handleMasseurSelect = (masseur: any) => {
    navigate('/booking', { state: { masseur } });
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between w-full p-4 border-b border-gray-200">
        <button className="p-2" onClick={toggleMenu}>
          <Menu size={24} />
        </button>
        <div className="text-xl font-bold">RelaxGo</div>
        <div className="w-10"></div> {/* Empty div for spacing */}
      </div>

      {/* Side Menu/Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={toggleMenu}
          ></div>
          <div className="relative w-64 max-w-xs bg-white h-full shadow-xl flex flex-col">
            {/* User Account Section */}
            <div 
              className="p-4 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                navigate('/profile');
                setMenuOpen(false);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">My Account</div>
                  <div className="text-sm font-bold text-blue-600">{userInfo.name}</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Main Navigation */}
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Navigation
                </div>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => {
                        navigate('/bookings?view=past');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 flex items-center"
                    >
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      Past Bookings
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        navigate('/payment-methods');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 flex items-center"
                    >
                      <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                      Payment Methods
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        navigate('/privacy');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 flex items-center"
                    >
                      <Lock className="h-4 w-4 text-gray-500 mr-2" />
                      Privacy
                    </button>
                  </li>
                </ul>
              </div>
              
              {/* Become a Masseur Section */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Opportunities
                </div>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => {
                        // Check if the user is already registered as a masseur
                        if (isMasseurRegistered()) {
                          // If already registered, redirect directly to the masseur dashboard
                          navigate('/masseur-dashboard');
                        } else {
                          // Otherwise, start the registration process
                          navigate('/masseur-signup');
                        }
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center"
                    >
                      <Briefcase className="h-4 w-4 text-blue-600 mr-2" />
                      <span>
                        {isMasseurRegistered() ? 'Masseur Dashboard' : 'Become a Masseur'}
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-3 shadow-sm bg-white z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for a masseur near you"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Massage Types Section with Title */}
      <div className="px-4 pb-2 pt-3 bg-white z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-semibold text-gray-800">Types of Massage</h3>
          <div className="text-sm text-gray-500">
            {filteredMasseurs.length} masseur{filteredMasseurs.length !== 1 ? 's' : ''} available
          </div>
        </div>
        
        <div className="relative">
          {/* Left Arrow */}
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-1 z-10 bg-white rounded-full shadow-md p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          {/* Scrollable massage types */}
          <div 
            ref={typeScrollRef}
            className="flex overflow-x-auto py-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="flex space-x-2 px-6">
              {massageTypes.map((type) => (
                <MassageTypeButton
                  key={type.id}
                  type={type}
                  isSelected={selectedMassageType === type.id}
                  onClick={() => setSelectedMassageType(type.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Right Arrow */}
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-1 z-10 bg-white rounded-full shadow-md p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 pt-2 pb-3 flex justify-center bg-white shadow-sm z-10">
        <div className="inline-flex rounded-lg p-1 bg-gray-100">
          <button
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center",
              view === "map"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setView("map")}
          >
            <MapPin size={16} className="mr-1" />
            Map
          </button>
          <button
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center",
              view === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setView("list")}
          >
            <List size={16} className="mr-1" />
            List
          </button>
        </div>
      </div>

      {/* Main Content */}
      {view === "map" ? (
        <>
          {/* Map View */}
          <div 
            style={{ 
              flexGrow: 1,
              height: 'calc(100vh - 240px)',
              width: '100%',
              position: 'relative'
            }}
          >
            {filteredMasseurs.length > 0 ? (
              <Map 
                masseurs={filteredMasseurs} 
                onMasseurSelect={handleMasseurSelect} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                <div className="bg-gray-200 rounded-full p-4 mb-4">
                  <MapPin size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No masseurs available</h3>
                <p className="text-gray-600">
                  There are no masseurs offering {selectedMassageType !== "all" && massageTypes.find(t => t.id === selectedMassageType)?.name} 
                  massage services in this area.
                </p>
                <button 
                  onClick={() => setSelectedMassageType("all")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                >
                  Show all masseurs
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filteredMasseurs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredMasseurs.map((masseur, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  onClick={() => handleMasseurSelect(masseur)}
                >
                  <div className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{masseur.name}</h3>
                        <p className="text-sm text-gray-500">{masseur.specialty}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{masseur.rating}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-blue-600 font-bold">${masseur.price}/hour</div>
                      <div className="text-sm text-gray-500">{masseur.distance} away</div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className={`text-sm font-medium ${masseur.available ? 'text-green-600' : 'text-gray-500'}`}>
                        {masseur.available ? 'Available now' : 'Not available'}
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors">
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-gray-200 rounded-full p-4 mb-4">
                <List size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No masseurs available</h3>
              <p className="text-gray-600">
                There are no masseurs offering {selectedMassageType !== "all" && massageTypes.find(t => t.id === selectedMassageType)?.name} 
                massage services in this area.
              </p>
              <button 
                onClick={() => setSelectedMassageType("all")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                Show all masseurs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <NavBar />
    </div>
  );
};

export default HomeScreen;
