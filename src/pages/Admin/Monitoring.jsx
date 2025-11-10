import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { FaSearch, FaFilter } from "react-icons/fa";
import { mockSweeperList, mockRoutes } from "../../utils/mockData";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Polygon,
  Polyline,
} from "@react-google-maps/api";

const Monitoring = () => {
  // Check if Google Maps is available
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    // Check if Google Maps is loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps is available in Monitoring");
      setIsMapReady(true);
    } else {
      console.error("Google Maps API not found in Monitoring");
    }
  }, []);

  const [selectedSweeper, setSelectedSweeper] = useState(null);
  const [activeSweepers, setActiveSweepers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Generate random locations around the route area for sweepers
  useEffect(() => {
    const createSweeperLocations = () => {
      return mockSweeperList.map((sweeper) => {
        // Generate a random location near the route
        const baseLat = 17.667;
        const baseLng = 75.893;
        const randomLat = baseLat + (Math.random() - 0.5) * 0.01;
        const randomLng = baseLng + (Math.random() - 0.5) * 0.01;

        // Determine if they are within the geofence
        const isWithinGeofence =
          sweeper.status === "active" && sweeper.today === "present";

        return {
          ...sweeper,
          location: {
            lat: randomLat,
            lng: randomLng,
          },
          inGeofence: isWithinGeofence,
          lastUpdated: new Date().toISOString(),
        };
      });
    };

    setActiveSweepers(createSweeperLocations());
  }, []);

  // Handle map load
  const handleMapLoad = (map) => {
    console.log("Map loaded successfully in Monitoring component");
    setMapInstance(map);
  };

  // If Google Maps API isn't ready
  if (!isMapReady) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg mt-6">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">
        Real-time Monitoring
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <div className="h-full">
              <GoogleMap
                mapContainerClassName="w-full h-full rounded-lg"
                center={{ lat: 17.667, lng: 75.893 }}
                zoom={15}
                onLoad={handleMapLoad}
                options={{
                  gestureHandling: "cooperative",
                  disableDefaultUI: false,
                }}
              >
                {/* Show route geofence and path if a sweeper is selected */}
                {selectedSweeper && mockRoutes[0] && (
                  <>
                    <Polygon
                      paths={mockRoutes[0].geofence}
                      options={{
                        fillColor: "#1976d2",
                        fillOpacity: 0.1,
                        strokeColor: "#1976d2",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                      }}
                    />
                    <Polyline
                      path={mockRoutes[0].routePath}
                      options={{
                        strokeColor: "#4caf50",
                        strokeOpacity: 0.8,
                        strokeWeight: 5,
                      }}
                    />
                  </>
                )}

                {/* Show all active sweepers on the map */}
                {activeSweepers.map((sweeper) => (
                  <Marker
                    key={sweeper.id}
                    position={sweeper.location}
                    onClick={() => {
                      setSelectedMarker(sweeper);
                      setSelectedSweeper(sweeper);
                    }}
                    icon={{
                      url: sweeper.inGeofence
                        ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                        : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    }}
                  />
                ))}

                {/* Show info window for selected marker */}
                {selectedMarker && (
                  <InfoWindow
                    position={selectedMarker.location}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1">
                      <h3 className="font-medium">{selectedMarker.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedMarker.zone} Zone
                      </p>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedMarker.inGeofence ? "success" : "danger"
                          }
                          className="text-xs"
                        >
                          {selectedMarker.inGeofence
                            ? "Within Route"
                            : "Outside Route"}
                        </Badge>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Active Sweepers</h2>
              <Badge variant="success">
                {activeSweepers.filter((s) => s.today === "present").length} Online
              </Badge>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search sweepers..."
                className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <FaFilter className="mr-1" /> Filter
              </button>
              <button className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                All
              </button>
              <button className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">
                Within Route
              </button>
              <button className="bg-danger/10 text-danger px-3 py-1 rounded-full text-xs font-medium">
                Outside Route
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {activeSweepers.map((sweeper) => (
                <div
                  key={sweeper.id}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedSweeper && selectedSweeper.id === sweeper.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-gray-50"}
                  `}
                  onClick={() => setSelectedSweeper(sweeper)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{sweeper.name}</span>
                    <Badge
                      variant={sweeper.inGeofence ? "success" : "danger"}
                      className="text-xs"
                    >
                      {sweeper.inGeofence ? "Within" : "Outside"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {sweeper.zone} Zone
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Verifications: {sweeper.verifications}/5</span>
                    <span>
                      Last update:{" "}
                      {new Date(sweeper.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedSweeper && (
            <Card>
              <h2 className="text-lg font-medium mb-4">Sweeper Details</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div className="font-medium">{selectedSweeper.name}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Zone</div>
                  <div className="font-medium">{selectedSweeper.zone}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <Badge
                    variant={
                      selectedSweeper.status === "active" ? "success" : "warning"
                    }
                    className="capitalize"
                  >
                    {selectedSweeper.status}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Current Route</div>
                  <div className="font-medium">Solapur Central</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Location</div>
                  <div className="text-sm font-mono">
                    Lat: {selectedSweeper.location.lat.toFixed(6)}
                    <br />
                    Lng: {selectedSweeper.location.lng.toFixed(6)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Verifications</div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${(selectedSweeper.verifications / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span>{selectedSweeper.verifications}/5</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                  <div className="font-medium">
                    {new Date(selectedSweeper.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex-1">
                  Contact
                </button>
                <button className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium flex-1">
                  View Route
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring;