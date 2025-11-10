import React, { useState, useEffect, createContext, useContext } from 'react';
import { LoadScript } from '@react-google-maps/api';

// All libraries needed across the application
const LIBRARIES = ["drawing", "geometry", "places", "marker"];

// Create context
const MapsContext = createContext({
  isLoaded: false,
  loadError: null,
});

// Main component that provides Google Maps loading functionality
const LoadMapsScript = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      <LoadScript
        googleMapsApiKey="AIzaSyBgYsaFLC6xvh8kKyNVwuzFTSY5qBi2pjA"
        libraries={LIBRARIES}
        loadingElement={<div>Loading Google Maps...</div>}
        id="google-map-script"
        language="en"
        region="US"
        version="weekly"
        loadingCallback={() => console.log("Google Maps script loading...")}
        onLoad={() => {
          console.log("Google Maps script loaded successfully");
          setIsLoaded(true);
        }}
        onError={(error) => {
          console.error("Error loading Google Maps script:", error);
          setLoadError(error);
        }}
      >
        {children}
      </LoadScript>
    </MapsContext.Provider>
  );
};

// Hook for using the Maps context
export const useMapsContext = () => {
  const context = useContext(MapsContext);
  if (!context) {
    throw new Error('useMapsContext must be used within a LoadMapsScript provider');
  }
  return context;
};

// Named exports for the component and hook
export { LoadMapsScript as MapsProvider };

// Default export
export default LoadMapsScript;
