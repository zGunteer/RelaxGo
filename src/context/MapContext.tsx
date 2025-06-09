import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useRef, useCallback } from 'react';

interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface MapState {
  center: LatLngLiteral;
  zoom: number;
}

interface MapContextType extends MapState {
  setMapState: Dispatch<SetStateAction<MapState>>;
  getMapInstance: () => google.maps.Map | null;
  initializeMap: (container: HTMLDivElement, controlsPosition?: 'top' | 'bottom') => google.maps.Map;
}

// Default initial state for the map
const initialMapCenter: LatLngLiteral = { lat: 44.439663, lng: 26.096306 }; // Bucharest
const initialMapZoom: number = 12;

const defaultMapState: MapState = {
  center: initialMapCenter,
  zoom: initialMapZoom,
};

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [mapState, setMapState] = useState<MapState>(defaultMapState);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const isInitialized = useRef<boolean>(false);

  const getMapInstance = useCallback(() => {
    return mapInstanceRef.current;
  }, []);

  const initializeMap = useCallback((container: HTMLDivElement, controlsPosition: 'top' | 'bottom' = 'top'): google.maps.Map => {
    // If map already exists, just move it to the new container
    if (mapInstanceRef.current && isInitialized.current) {
      console.log('Map already exists, reusing existing instance');
      // Clear the old container and move map to new container
      const mapDiv = mapInstanceRef.current.getDiv();
      if (mapDiv.parentNode !== container) {
        container.appendChild(mapDiv);
      }
      return mapInstanceRef.current;
    }

    console.log('Creating map instance for the first time');

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
      const map = new google.maps.Map(container, {
        center: mapState.center,
        zoom: mapState.zoom, 
        fullscreenControl: false, 
        mapTypeControl: false, 
        streetViewControl: false, 
        zoomControl: true,         
        zoomControlOptions: {
          position: controlsPosition === 'bottom' 
            ? google.maps.ControlPosition.RIGHT_BOTTOM 
            : google.maps.ControlPosition.TOP_RIGHT,
        },
        styles: mapStyles,
        gestureHandling: 'greedy',
        disableDefaultUI: true,
        scaleControl: false,
        rotateControl: false,
        clickableIcons: false,
      });

      mapInstanceRef.current = map;
      isInitialized.current = true;

      // Add listeners to update context on map interaction
      map.addListener('center_changed', () => {
        const newCenter = map.getCenter();
        if (newCenter) {
          setMapState(prevState => ({
            ...prevState,
            center: { lat: newCenter.lat(), lng: newCenter.lng() },
          }));
        }
      });

      map.addListener('zoom_changed', () => {
        const newZoom = map.getZoom();
        if (newZoom) {
          setMapState(prevState => ({
            ...prevState,
            zoom: newZoom,
          }));
        }
      });

      console.log('Map created successfully and will persist across navigation');
      return map;

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      throw error;
    }
  }, []);

  return (
    <MapContext.Provider value={{ ...mapState, setMapState, getMapInstance, initializeMap }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}; 