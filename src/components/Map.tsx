import React, { useEffect, useRef } from 'react';

interface Masseur {
  name: string;
  rating: string;
  specialty: string;
  price: number;
  distance: string;
  available: boolean;
  position: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  masseurs: Masseur[];
  onMasseurSelect?: (masseur: Masseur) => void;
  currentLocation?: { lat: number; lng: number };
  onlyShowMap?: boolean;
  controlsPosition?: 'top' | 'bottom';
}

const Map: React.FC<MapProps> = ({ 
  masseurs, 
  onMasseurSelect, 
  currentLocation,
  onlyShowMap = false,
  controlsPosition = 'top'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const locationMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      console.log('Initializing map with container:', mapRef.current);
      
      // Modern map style inspired by standard Google Maps (colorful)
      const mapStyles = [
        {
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "poi",
          "stylers": [
            { "clickable": false }
          ]
        },
        {
          "featureType": "transit",
          "stylers": [
            { "clickable": false }
          ]
        },
        {
          "featureType": "road",
          "stylers": [
            { "clickable": false }
          ]
        },
        {
          "featureType": "landscape",
          "stylers": [
            { "clickable": false }
          ]
        },
        {
          "featureType": "administrative",
          "stylers": [
            { "clickable": false }
          ]
        },
        {
          "featureType": "administrative.locality",
          "elementType": "labels.text.fill",
          "stylers": [
            { "color": "#4a4a4a" }
          ]
        },
        {
          "featureType": "landscape.natural",
          "elementType": "geometry.fill",
          "stylers": [
            { "visibility": "on" },
            { "color": "#e0efef" }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [
            { "visibility": "on" },
            { "color": "#a4ddf5" }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [
            { "color": "#ffffff" }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [
            { "color": "#d7d7d7" }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [
            { "color": "#ffcc99" }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [
            { "color": "#ff9966" }
          ]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [
            { "visibility": "on" },
            { "color": "#449999" }
          ]
        },
        {
          "featureType": "transit.station",
          "elementType": "labels.icon",
          "stylers": [
            { "visibility": "on" }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry.fill",
          "stylers": [
            { "color": "#c6e7c6" },
            { "visibility": "on" }
          ]
        }
      ];

      try {
        // Use currentLocation if provided, otherwise default to Bucharest
        const center = currentLocation || { lat: 44.4268, lng: 26.1025 };

        const map = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: 15, // Zoom in closer when showing current location
          fullscreenControl: false,   // Remove fullscreen control
          mapTypeControl: false,      // Remove map type control (satellite/terrain)
          streetViewControl: false,   // Remove street view (little person)
          zoomControl: true,         
          zoomControlOptions: {
            position: controlsPosition === 'bottom' 
              ? google.maps.ControlPosition.RIGHT_BOTTOM 
              : google.maps.ControlPosition.TOP_RIGHT,
          },
          styles: mapStyles,
          // Modern UI options
          gestureHandling: 'greedy', // Make it easier to handle on mobile
          disableDefaultUI: true,     // Remove all controls
          scaleControl: false,        // Remove scale control
          rotateControl: false,       // Remove rotate control
          clickableIcons: false,      // Disable clickability of default Google POIs
        });

        mapInstanceRef.current = map;
        console.log('Map created successfully');
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    }
  }, [currentLocation, controlsPosition]);

  // Update current location marker when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;
    
    // Remove old location marker if it exists
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
    }

    // Create location dot with ripple effect
    if (onlyShowMap) {
      // In masseur dashboard mode, don't show the explicit marker
      // as it's handled by the UI overlay
      map.setCenter(currentLocation);
    } else {
      // Create a masseur location marker
      const marker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4', // Google Maps blue
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10,
        },
        zIndex: 10, // Make sure it's above other markers
      });
      
      locationMarkerRef.current = marker;
      map.setCenter(currentLocation);
    }
  }, [currentLocation, onlyShowMap]);

  // Update markers when masseurs prop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || onlyShowMap) return; // Don't show masseur markers in onlyShowMap mode

    // Close any open info windows
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current = [];

    // Add click listener to the map to close any open info window
    map.addListener('click', () => {
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
        activeInfoWindowRef.current = null;
      }
    });

    // Add new markers for each masseur
    masseurs.forEach((masseur, index) => {
      // Create a custom marker element
      const markerColor = masseur.available ? '#FF385C' : '#9CA3AF'; // Airbnb red or gray
      
      // Create a marker with custom styling
      const marker = new google.maps.Marker({
        position: masseur.position,
        map: map,
        title: masseur.name,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10, // Slightly larger for better visibility
        }
      });

      // Only add info windows if onMasseurSelect handler is provided
      if (onMasseurSelect) {
        // Create info window for click
        const infoContent = `
          <div class="bg-white rounded-lg shadow-lg max-w-[280px] overflow-hidden" id="info-window-${index}" style="border-radius: 16px; overflow: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.12); position: relative;">
            <style>
              /* Hide the default Google Maps close button */
              .gm-ui-hover-effect {
                display: none !important;
              }
            </style>
            <div class="close-button" id="close-button-${index}" style="position: absolute; top: 0; right: 0; width: 24px; height: 24px; background-color: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10;">
              <span style="font-size: 16px; font-weight: bold; color: #666;">×</span>
            </div>
            <div class="p-4">
              <div class="flex items-center mb-2">
                <div class="rounded-full bg-blue-100 h-8 w-8 flex items-center justify-center mr-2">
                  <span class="text-blue-600 font-semibold">${masseur.name.charAt(0)}</span>
                </div>
                <div>
                  <div class="font-semibold text-gray-900">${masseur.name}</div>
                  <div class="text-sm text-gray-500">${masseur.specialty}</div>
                </div>
              </div>
              
              <div class="flex justify-between items-center my-2">
                <div class="flex items-center">
                  <span class="text-yellow-500 mr-1">★</span>
                  <span class="text-sm font-medium">${masseur.rating}</span>
                </div>
                <div class="text-sm text-gray-500">${masseur.distance} away</div>
              </div>
              
              <div class="flex justify-between items-center mb-3">
                <div class="text-base font-semibold">$${masseur.price}/hour</div>
                ${masseur.available ? 
                  `<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Available now</span>` : 
                  `<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Unavailable</span>`
                }
              </div>
              
              <button id="book-button-${index}" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors" style="border-radius: 8px;">
                Book Now
              </button>
            </div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
          content: infoContent,
          disableAutoPan: false,
          pixelOffset: new google.maps.Size(0, -10),
          // Custom styling for info window
          maxWidth: 320,
          ariaLabel: masseur.name
        });
        
        // Prevent the default close button from showing
        // @ts-ignore - This is valid but not in the TypeScript definitions
        infoWindow.set("hideCloseButton", true);
        
        infoWindowsRef.current.push(infoWindow);

        // Add click listener for marker
        marker.addListener('click', (e) => {
          // Stop event propagation to prevent the map click from immediately closing the window
          e.stop();
          
          // Close any open info window
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
          }
          
          // Open this info window
          infoWindow.open(map, marker);
          activeInfoWindowRef.current = infoWindow;
          
          // Add event listener for Book Now button and close button after the info window is open
          google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const bookButton = document.getElementById(`book-button-${index}`);
            if (bookButton) {
              bookButton.addEventListener('click', (e) => {
                e.preventDefault();
                onMasseurSelect(masseur);
                if (activeInfoWindowRef.current) {
                  activeInfoWindowRef.current.close();
                }
              });
            }
            
            const closeButton = document.getElementById(`close-button-${index}`);
            if (closeButton) {
              closeButton.addEventListener('click', () => {
                infoWindow.close();
                activeInfoWindowRef.current = null;
              });
            }
          });
        });
      }

      markersRef.current.push(marker);
    });
  }, [masseurs, onMasseurSelect, onlyShowMap]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '4px'
      }}
    ></div>
  );
};

export default Map; 