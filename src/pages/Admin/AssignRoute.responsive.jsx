import React, { useState, useRef, useEffect } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import axios from "axios";
import {
  GoogleMap,
  Polygon,
  Marker,
  Polyline,
  Circle,
  DrawingManager,
  InfoWindow,
} from "@react-google-maps/api";
import {
  FaDrawPolygon,
  FaCircle,
  FaUpload,
  FaSave,
  FaSync,
  FaExclamationCircle,
  FaCheckCircle,
  FaPlus,
  FaTimes,
  FaEye,
  FaTrash,
} from "react-icons/fa";
import Modal from "../../components/common/Modal";

// API base - runtime-safe
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE) ||
  "https://smc-backend-bjm5.onrender.com";

// Geofence types
const GEOFENCE_TYPES = {
  POLYGON: "polygon",
  CIRCLE: "circle",
};

const AssignRoute = () => {
  // ... keep all your existing state and hooks ...

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-heading font-semibold">Sweepers & Geofences</h1>
        {error && (
          <div className="w-full sm:w-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-3 flex items-center text-sm">
            <FaExclamationCircle className="mr-2 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button className="ml-2 text-red-700 hover:text-red-900" onClick={() => setError(null)}>
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sweepers list */}
        <Card className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Sweepers</h2>
            <Button 
              variant="outline" 
              color="secondary" 
              size="sm" 
              onClick={fetchSweepers}
              className="p-2"
              title="Refresh List"
            >
              <FaSync className="w-4 h-4" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-24rem)] space-y-2">
            {sweepers.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">No sweepers found</div>
            )}
            {sweepers.map((s) => {
              const id = s._id || s.id || s.userId;
              const isSelected = selectedSweeper && ((selectedSweeper._id || selectedSweeper.id) === id);
              return (
                <div 
                  key={id} 
                  className={`p-3 rounded border transition-colors ${
                    isSelected ? "border-primary bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div 
                      onClick={() => handleSelectSweeper(s)} 
                      className="cursor-pointer flex-1"
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email || id}</div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="xs"
                        variant="outline"
                        color="primary"
                        className="flex-1 sm:flex-none"
                        onClick={() => { setSelectedSweeper(s); setShowAssignModal(true); }}
                      >
                        Assign
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        color="secondary"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleSelectSweeper(s)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Map area */}
        <Card className="lg:col-span-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-medium">Map</h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                variant={isDrawingMode && drawingType === GEOFENCE_TYPES.POLYGON ? "solid" : "outline"}
                color="primary"
                size="sm"
                onClick={startDrawingPolygon}
                className="flex-1 sm:flex-none"
              >
                <FaDrawPolygon className="mr-1" /> 
                <span className="hidden sm:inline">Draw Area</span>
              </Button>
              <Button 
                variant={isDrawingMode && drawingType === GEOFENCE_TYPES.CIRCLE ? "solid" : "outline"}
                color="success"
                size="sm"
                onClick={startDrawingCircle}
                className="flex-1 sm:flex-none"
              >
                <FaCircle className="mr-1" /> 
                <span className="hidden sm:inline">Draw Radius</span>
              </Button>
              {isDrawingMode && (
                <Button 
                  variant="outline"
                  color="danger"
                  size="sm"
                  onClick={cancelDrawing}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              )}
              <Button 
                variant="outline"
                color="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none"
              >
                <FaUpload className="mr-1" /> 
                <span className="hidden sm:inline">Import</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.geojson"
                  className="hidden"
                  onChange={handleFileImport}
                />
              </Button>
            </div>
          </div>

          <div className="h-[50vh] sm:h-[60vh] mb-4">
            <GoogleMap
              mapContainerClassName="w-full h-full rounded-lg"
              center={{ lat: 17.667, lng: 75.893 }}
              zoom={15}
              onLoad={handleMapLoad}
              options={{
                gestureHandling: "cooperative",
                disableDefaultUI: false,
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              <DrawingManager 
                onLoad={handleDrawingManagerLoad} 
                onOverlayComplete={handleOverlayComplete} 
                options={{ drawingControl: false }} 
              />

              {displayedGeofence?.geofence?.length > 2 && (
                <Polygon
                  paths={displayedGeofence.geofence}
                  options={{
                    strokeColor: "#1976d2",
                    strokeOpacity: 0.9,
                    strokeWeight: 3,
                    fillColor: "#1976d2",
                    fillOpacity: 0.25,
                    zIndex: 10,
                  }}
                />
              )}

              {displayedGeofence?.checkpoints?.map((cp, idx) => (
                <Marker key={idx} position={{ lat: cp.lat, lng: cp.lng }} />
              ))}

              {infoWindow.visible && infoWindow.position && (
                <InfoWindow 
                  position={infoWindow.position} 
                  onCloseClick={() => setInfoWindow({ ...infoWindow, visible: false })}
                >
                  <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-sm text-gray-600">
              {selectedSweeper ? `Selected: ${selectedSweeper.name}` : "Select a sweeper to view their geofence"}
            </p>

            {displayedGeofence?.geofence?.length > 2 && (
              <Button 
                color="primary"
                size="sm"
                onClick={() => {
                  if (mapInstance) {
                    const bounds = new window.google.maps.LatLngBounds();
                    displayedGeofence.geofence.forEach((p) => 
                      bounds.extend(new window.google.maps.LatLng(p.lat, p.lng))
                    );
                    mapInstance.fitBounds(bounds);
                  }
                }}
              >
                Zoom to Assignment
              </Button>
            )}
          </div>
        </Card>

        {/* Custom Geofences panel */}
        <Card className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Custom Geofences</h2>
            <Button 
              variant="outline"
              color="secondary"
              size="sm"
              onClick={fetchCustomGeofences}
              className="p-2"
              title="Refresh List"
            >
              <FaSync className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-4">
            <Button 
              color="black"
              className="w-full flex items-center justify-center"
              onClick={startDrawingPolygon}
            >
              <FaPlus className="mr-2" /> Add Custom Geofence
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Draw on the map, then save. Saved geofences can be assigned to any sweeper.
            </p>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-32rem)] space-y-3">
            {customGeofences.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No custom geofences
              </div>
            )}
            {customGeofences.map((gf) => {
              const id = gf._id || gf.id;
              return (
                <div key={id} className="border rounded p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <div className="font-medium">{gf.name || "Unnamed"}</div>
                      <div className="text-xs text-gray-500">{gf.zone || "Zone not set"}</div>
                      <div className="text-xs text-gray-600">
                        Points: {(gf.geofence || gf.path || []).length}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="xs"
                        variant="outline"
                        color="secondary"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          if (mapInstance && (gf.geofence || gf.path)?.length > 0) {
                            const path = gf.geofence || gf.path;
                            const bounds = new window.google.maps.LatLngBounds();
                            path.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
                            mapInstance.fitBounds(bounds);
                          }
                          setDisplayedGeofence(gf);
                        }}
                      >
                        <FaEye className="sm:mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        color="success"
                        className="flex-1 sm:flex-none"
                        onClick={() => assignCustomFromList(id)}
                      >
                        <FaPlus className="sm:mr-1" />
                        <span className="hidden sm:inline">Assign</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        color="danger"
                        className="flex-1 sm:flex-none"
                        onClick={() => deleteCustomGeofence(gf)}
                      >
                        <FaTrash className="sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Save Custom Geofence Modal */}
      <Modal isOpen={showSaveGeofenceModal} onClose={() => setShowSaveGeofenceModal(false)}>
        <div className="px-4 sm:px-6 py-4 bg-primary text-white">
          <h3 className="text-lg font-medium">Save Custom Geofence</h3>
        </div>
        <div className="p-4 sm:p-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Name</label>
          <input
            value={newGeofenceName}
            onChange={(e) => setNewGeofenceName(e.target.value)}
            className="w-full p-3 border rounded text-sm"
            placeholder="Enter geofence name"
          />
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              color="default"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowSaveGeofenceModal(false);
                if (selectedGeofenceTemp?.overlay) selectedGeofenceTemp.overlay.setMap(null);
                setSelectedGeofenceTemp(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="black"
              className="w-full sm:w-auto"
              onClick={saveCustomGeofence}
            >
              <FaSave className="mr-1" /> Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <div className="px-4 sm:px-6 py-4 bg-primary text-white">
          <h3 className="text-lg font-medium">
            Assign Geofence to {selectedSweeper?.name || "Sweeper"}
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <p className="mb-3 text-sm text-gray-700">Choose geofence to assign:</p>

          <div className="mb-4">
            <label className="block font-medium mb-2">Use currently displayed assignment</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 p-3 rounded">
              <div>
                <div className="font-medium">{displayedGeofence?.name || "No displayed geofence"}</div>
                <div className="text-xs text-gray-500">Points: {displayedGeofence?.geofence?.length || 0}</div>
              </div>
              <Button
                color="primary"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!displayedGeofence) {
                    setError("No displayed geofence to assign");
                    return;
                  }
                  assignGeofenceToSweeper({ geofenceObj: displayedGeofence });
                }}
              >
                Assign
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Or pick a custom geofence</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {customGeofences.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  No custom geofences
                </div>
              )}
              {customGeofences.map((gf) => {
                const id = gf._id || gf.id;
                return (
                  <div key={id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-white rounded">
                    <div>
                      <div className="font-medium">{gf.name}</div>
                      <div className="text-xs text-gray-500">
                        Points: {(gf.geofence || gf.path || []).length}
                      </div>
                    </div>
                    <Button
                      color="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => assignCustomFromList(id)}
                    >
                      Assign
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              color="default"
              onClick={() => setShowAssignModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignRoute;