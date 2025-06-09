import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  error?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = "Enter your address",
  defaultValue = "",
  className = "",
  error
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        
        // Create a dummy map element for PlacesService (required by Google)
        const dummyMap = new window.google.maps.Map(document.createElement('div'));
        placesService.current = new window.google.maps.places.PlacesService(dummyMap);
        setGoogleLoaded(true);
        return true;
      }
      return false;
    };

    // Try to initialize immediately
    if (!checkGoogleMaps()) {
      // If not loaded, wait for the script to load
      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          clearInterval(interval);
        }
      }, 100);

      // Clean up interval after 10 seconds
      setTimeout(() => {
        clearInterval(interval);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || !autocompleteService.current || !googleLoaded) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'RO' }, // Restrict to Romania
        types: ['address']
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (results, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results.map(result => ({
              place_id: result.place_id,
              description: result.description
            })));
            setShowSuggestions(true);
          } else {
            setPredictions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setIsLoading(false);
      setPredictions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search
    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handlePlaceSelect = async (prediction: Prediction) => {
    if (!placesService.current || !googleLoaded) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setInputValue(prediction.description);

    try {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address']
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = place.geometry.location;
          onPlaceSelect({
            address: place.formatted_address || prediction.description,
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error('Error getting place details:', status);
        }
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (predictions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${error ? 'border-red-500' : ''} ${className}`}
          disabled={!googleLoaded}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {!googleLoaded && (
        <p className="mt-1 text-sm text-gray-500">Loading address search...</p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handlePlaceSelect(prediction)}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-900 truncate">{prediction.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesAutocomplete; 