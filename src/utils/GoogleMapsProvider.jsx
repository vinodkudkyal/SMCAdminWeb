import React from 'react';

// This file is now just a re-export of the LoadMapsScript component
export { MapsProvider as GoogleMapsProvider, useMapsContext as useGoogleMaps } from './LoadMapsScript';
const ALL_LIBRARIES = ["drawing", "geometry", "places", "marker"];

// Create context
const GoogleMapsContext = createContext(null);

// Provider component
export const GoogleMapsProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Handle script load success
  const handleLoad = () => {
    console.log("Google Maps script loaded successfully");
    setScriptLoaded(true);
  };

  // Handle script load error
  const handleError = (error) => {
    console.error("Error loading Google Maps script:", error);
    setLoadError(error);
  };

  // Check if the Google Maps API is fully available
  useEffect(() => {
    if (scriptLoaded) {
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && 
            window.google.maps.Map && 
            window.google.maps.drawing &&
            window.google.maps.drawing.DrawingManager) {
          console.log("Google Maps API fully loaded");
          setIsLoaded(true);
          clearInterval(checkGoogleMaps);
        }
      }, 100);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        if (!isLoaded) {
          console.warn("Timeout waiting for Google Maps API to fully load");
          setLoadError(new Error("Timeout loading Google Maps API"));
        }
      }, 10000);
      
      return () => {
        clearInterval(checkGoogleMaps);
      };
    }
  }, [scriptLoaded, isLoaded]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      <LoadScript
        id="google-maps-script"
        googleMapsApiKey="AIzaSyBgYsaFLC6xvh8kKyNVwuzFTSY5qBi2pjA"
        libraries={ALL_LIBRARIES}
        onLoad={handleLoad}
        onError={handleError}
        loadingElement={<div>Loading Maps...</div>}
      >
        {children}
      </LoadScript>
    </GoogleMapsContext.Provider>
  );
};

// Custom hook to use the Google Maps context
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === null) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};
