import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Default libraries
const defaultLibraries = ['places', 'geometry', 'drawing'];

/**
 * A wrapper component that loads the Google Maps JavaScript API once
 * and provides a consistent loading experience across the application
 */
const MapWrapper = ({ 
  children, 
  libraries = defaultLibraries,
  loadingComponent,
  errorComponent
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBgYsaFLC6xvh8kKyNVwuzFTSY5qBi2pjA",
    libraries,
    id: 'google-map-script', // Ensures single instance
  });

  // Handle loading state
  if (!isLoaded) {
    if (loadingComponent) return loadingComponent;
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // Handle loading error
  if (loadError) {
    if (errorComponent) return errorComponent(loadError);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h2 className="text-lg font-medium mb-2">Error Loading Google Maps</h2>
        <p>There was an error loading the Google Maps API. Please try again later.</p>
        <p className="text-sm mt-2">Error details: {loadError.message}</p>
      </div>
    );
  }

  // Return children when API is loaded successfully
  return <>{children}</>;
};

export default MapWrapper;
