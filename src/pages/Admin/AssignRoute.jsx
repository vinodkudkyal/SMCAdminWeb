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
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sweepers & selection
  const [sweepers, setSweepers] = useState([]);
  const [selectedSweeper, setSelectedSweeper] = useState(null);

  // Map & geofence
  const [mapInstance, setMapInstance] = useState(null);
  const [drawingManagerInstance, setDrawingManagerInstance] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingType, setDrawingType] = useState(null);

  // Custom geofences (create-only list)
  const [customGeofences, setCustomGeofences] = useState([]);

  // Currently displayed assignment/geofence (for selected sweeper)
  const [displayedGeofence, setDisplayedGeofence] = useState(null);

  // Overlays on map (to be able to remove/highlight)
  const [overlays, setOverlays] = useState([]);

  // Temp geofence drawn (before saving as custom)
  const [selectedGeofenceTemp, setSelectedGeofenceTemp] = useState(null);
  const [showSaveGeofenceModal, setShowSaveGeofenceModal] = useState(false);
  const [newGeofenceName, setNewGeofenceName] = useState("");

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSelectedCustomId, setAssignSelectedCustomId] = useState(null);

  const fileInputRef = useRef(null);

  // Info window
  const [infoWindow, setInfoWindow] = useState({
    position: null,
    content: "",
    visible: false,
  });

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsMapReady(true);
    } else {
      console.warn("Google Maps API not loaded yet");
    }
  }, []);

  useEffect(() => {
    fetchSweepers();
    fetchCustomGeofences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch sweepers
  const fetchSweepers = async () => {
    setIsLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/sweepers`);
      const data = resp.data;
      if (data && data.sweepers) setSweepers(data.sweepers);
      else if (Array.isArray(data)) setSweepers(data);
      else setSweepers([]);
    } catch (err) {
      console.error("Error fetching sweepers:", err);
      setSweepers([]);
      setError("Failed to load sweepers");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch custom geofences
  const fetchCustomGeofences = async () => {
    setIsLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/geofences`);
      const data = resp.data;
      if (data && data.geofences) setCustomGeofences(data.geofences);
      else if (Array.isArray(data)) setCustomGeofences(data);
      else setCustomGeofences([]);
    } catch (err) {
      console.error("Error fetching geofences:", err);
      setCustomGeofences([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Map load
  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const handleDrawingManagerLoad = (drawingManager) => {
    setDrawingManagerInstance(drawingManager);
  };

  const startDrawingPolygon = () => {
    if (drawingManagerInstance) {
      drawingManagerInstance.setDrawingMode(
        window.google.maps.drawing.OverlayType.POLYGON
      );
      drawingManagerInstance.setOptions({
        polygonOptions: {
          fillColor: "#1976d2",
          fillOpacity: 0.3,
          strokeColor: "#1976d2",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        },
      });
      setIsDrawingMode(true);
      setDrawingType(GEOFENCE_TYPES.POLYGON);
    }
  };

  const startDrawingCircle = () => {
    if (drawingManagerInstance) {
      drawingManagerInstance.setDrawingMode(
        window.google.maps.drawing.OverlayType.CIRCLE
      );
      drawingManagerInstance.setOptions({
        circleOptions: {
          fillColor: "#4caf50",
          fillOpacity: 0.3,
          strokeColor: "#4caf50",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        },
      });
      setIsDrawingMode(true);
      setDrawingType(GEOFENCE_TYPES.CIRCLE);
    }
  };

  const cancelDrawing = () => {
    if (drawingManagerInstance) drawingManagerInstance.setDrawingMode(null);
    setIsDrawingMode(false);
    setDrawingType(null);
  };

  // When overlay complete (drawing finished)
  const handleOverlayComplete = (event) => {
    cancelDrawing();

    const overlay = event.overlay;
    const type =
      event.type === window.google.maps.drawing.OverlayType.POLYGON
        ? GEOFENCE_TYPES.POLYGON
        : GEOFENCE_TYPES.CIRCLE;

    const temp = {
      id: `temp-${Date.now()}`,
      overlay,
      type,
      createdAt: new Date(),
    };

    if (type === GEOFENCE_TYPES.POLYGON) {
      const path = overlay.getPath().getArray().map((p) => ({
        lat: p.lat(),
        lng: p.lng(),
      }));
      temp.geofence = path;
    } else {
      temp.center = {
        lat: overlay.getCenter().lat(),
        lng: overlay.getCenter().lng(),
      };
      temp.radius = overlay.getRadius();
    }

    // Keep the overlay visible on the map (user can save)
    setSelectedGeofenceTemp(temp);
    setNewGeofenceName("");
    setShowSaveGeofenceModal(true);
  };

  // Save custom geofence (POST /geofences)
  const saveCustomGeofence = async () => {
    if (!selectedGeofenceTemp) return;
    if (!newGeofenceName || newGeofenceName.trim() === "") {
      setError("Please enter a name for the geofence");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: newGeofenceName,
        zone: selectedGeofenceTemp.zone || "",
        landmark: selectedGeofenceTemp.landmark || "",
        geofence: selectedGeofenceTemp.geofence || [],
        checkpoints: selectedGeofenceTemp.checkpoints || [],
      };

      const resp = await axios.post(`${API_BASE}/geofences`, payload);
      const created = resp.data && resp.data.geofence ? resp.data.geofence : resp.data;

      // refresh list
      await fetchCustomGeofences();

      // clear temp
      setSelectedGeofenceTemp(null);
      setShowSaveGeofenceModal(false);
    } catch (err) {
      console.error("Error saving geofence:", err);
      setError("Failed to save geofence");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove overlays helper
  const clearOverlays = () => {
    overlays.forEach((o) => {
      try {
        if (o && o.setMap) o.setMap(null);
      } catch (e) {}
    });
    setOverlays([]);
  };

  // Highlight overlay
  const highlightOverlay = (overlay, type) => {
    if (!overlay) return;
    try {
      if (type === GEOFENCE_TYPES.POLYGON) {
        overlay.setOptions({
          strokeWeight: 3,
          strokeColor: "#2196f3",
          fillColor: "#2196f3",
          fillOpacity: 0.45,
          zIndex: 1000,
        });
      } else {
        overlay.setOptions({
          strokeWeight: 3,
          strokeColor: "#4caf50",
          fillColor: "#4caf50",
          fillOpacity: 0.45,
          zIndex: 1000,
        });
      }
    } catch (e) {}
  };

  // Click sweeper -> immediately show their geofence on map and highlight it
  const handleSelectSweeper = async (sweeper) => {
    setSelectedSweeper(sweeper);
    setError(null);
    setDisplayedGeofence(null);

    try {
      setIsLoading(true);
      const id = sweeper._id || sweeper.id;
      const resp = await axios.get(`${API_BASE}/sweepers/${id}/assignment`);
      const data = resp.data;
      if (data && data.success) {
        const gf = data.geofence || [];
        const cps = data.checkpoints || [];

        const display = {
          id: `assigned-${id}`,
          name: sweeper.name ? `${sweeper.name} (assigned)` : "Assigned Geofence",
          geofence: Array.isArray(gf) ? gf : [],
          checkpoints: Array.isArray(cps) ? cps : [],
        };

        // clear old overlays
        clearOverlays();

        // create overlays for display
        const newOverlays = [];
        if (mapInstance && display.geofence && display.geofence.length > 2) {
          const polygon = new window.google.maps.Polygon({
            paths: display.geofence,
            fillColor: "#1976d2",
            fillOpacity: 0.25,
            strokeColor: "#1976d2",
            strokeWeight: 2,
            editable: false,
            zIndex: 10,
          });
          polygon.setMap(mapInstance);
          highlightOverlay(polygon, GEOFENCE_TYPES.POLYGON);
          newOverlays.push(polygon);

          // fit bounds
          const bounds = new window.google.maps.LatLngBounds();
          display.geofence.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
          mapInstance.fitBounds(bounds);
        } else if (mapInstance && display.checkpoints && display.checkpoints.length > 0) {
          const p = display.checkpoints[0];
          mapInstance.setCenter({ lat: p.lat, lng: p.lng });
          mapInstance.setZoom(15);
        }

        // add markers for checkpoints
        if (mapInstance && display.checkpoints && display.checkpoints.length > 0) {
          display.checkpoints.forEach((cp, idx) => {
            try {
              const marker = new window.google.maps.Marker({
                position: { lat: cp.lat, lng: cp.lng },
                map: mapInstance,
                title: `Checkpoint ${idx + 1}`,
              });
              newOverlays.push(marker);
            } catch (e) {}
          });
        }

        setOverlays(newOverlays);
        setDisplayedGeofence(display);

        // show info window
        let infoPos = null;
        if (display.geofence && display.geofence.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          display.geofence.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
          infoPos = bounds.getCenter();
        } else if (display.checkpoints && display.checkpoints.length > 0) {
          infoPos = display.checkpoints[0];
        }

        setInfoWindow({
          position: infoPos,
          content: `<div style="padding:8px;"><strong>${display.name}</strong><div style="font-size:12px;margin-top:4px;">Points: ${display.geofence?.length || 0}</div></div>`,
          visible: !!infoPos,
        });
      } else {
        setDisplayedGeofence(null);
        setError("No assignment found for this sweeper");
      }
    } catch (err) {
      console.error("Error loading assignment:", err);
      setError("Failed to load assignment for sweeper");
    } finally {
      setIsLoading(false);
    }
  };

  // Assign displayed geofence (or custom) to selected sweeper - saves to DB
  const assignGeofenceToSweeper = async ({ geofenceObj }) => {
    if (!selectedSweeper) {
      setError("Select a sweeper first");
      return;
    }
    if (!geofenceObj) {
      setError("Select a geofence to assign");
      return;
    }

    setIsLoading(true);
    try {
      const sweeperId = selectedSweeper._id || selectedSweeper.id;
      const payload = {
        geofence: geofenceObj.geofence || geofenceObj.path || [],
        checkpoints: geofenceObj.checkpoints || [],
      };

      const resp = await axios.put(`${API_BASE}/sweepers/${sweeperId}/assignment`, payload);
      if ((resp.data && resp.data.success) || resp.status === 200) {
        // refresh displayed assignment
        await handleSelectSweeper(selectedSweeper);
        setShowAssignModal(false);
      } else {
        // still attempt to refresh
        await handleSelectSweeper(selectedSweeper);
        setShowAssignModal(false);
      }
    } catch (err) {
      console.error("Error assigning geofence:", err);
      setError("Failed to assign geofence to sweeper");
    } finally {
      setIsLoading(false);
    }
  };

  // Assign custom geofence from list (helper wrapper)
  const assignCustomFromList = async (customId) => {
    const gf = customGeofences.find((g) => (g._id || g.id) === customId);
    if (!gf) {
      setError("Selected custom geofence not found");
      return;
    }
    await assignGeofenceToSweeper({ geofenceObj: gf });
  };

  // Delete custom geofence
  const deleteCustomGeofence = async (gf) => {
    if (!gf) return;
    try {
      setIsLoading(true);
      const id = gf._id || gf.id;
      await axios.delete(`${API_BASE}/geofences/${id}`);
      await fetchCustomGeofences();
    } catch (err) {
      console.error("Error deleting geofence:", err);
      setError("Failed to delete geofence");
    } finally {
      setIsLoading(false);
    }
  };

  // When component unmounts clear overlays
  useEffect(() => {
    return () => {
      clearOverlays();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // File import (optional)
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (json.features && json.features.length > 0) {
          const feature = json.features[0];
          if (feature.geometry && feature.geometry.type === "Polygon") {
            const coordinates = feature.geometry.coordinates[0];
            const path = coordinates.map((c) => ({ lat: c[1], lng: c[0] }));
            // create overlay
            if (mapInstance) {
              const polygon = new window.google.maps.Polygon({
                paths: path,
                fillColor: "#1976d2",
                fillOpacity: 0.3,
                strokeColor: "#1976d2",
                strokeWeight: 2,
                editable: true,
                draggable: true,
              });
              polygon.setMap(mapInstance);
              setSelectedGeofenceTemp({ id: `imported-${Date.now()}`, geofence: path, overlay: polygon });
              setNewGeofenceName(feature.properties?.name || "Imported Geofence");
              setShowSaveGeofenceModal(true);
            }
          }
        }
      } catch (err) {
        console.error("Error parsing import file", err);
        setError("Failed to process imported file");
      }
    };
    reader.readAsText(file);
  };

  // UI: If maps not ready show loader
  if (!isMapReady) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Waiting for Google Maps API (ensure LoadScript/Provider is set)</p>
        </div>
      </div>
    );
  }

  // Render component
  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">Sweepers & Geofences</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center">
          <FaExclamationCircle className="mr-2" />
          <span>{error}</span>
          <button className="ml-auto text-red-700 hover:text-red-900" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sweepers list */}
        <Card className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Sweepers</h2>
            <Button variant="outline" color="secondary" size="sm" onClick={fetchSweepers}>
              <FaSync />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-96 space-y-2">
            {sweepers.length === 0 && <div className="text-sm text-gray-500">No sweepers found</div>}
            {sweepers.map((s) => {
              const id = s._id || s.id || s.userId;
              const isSelected = selectedSweeper && ((selectedSweeper._id || selectedSweeper.id) === id);
              return (
                <div key={id} className={`p-2 rounded border ${isSelected ? "border-primary bg-blue-50" : "hover:bg-gray-50"}`}>
                  <div className="flex justify-between items-center">
                    <div onClick={() => handleSelectSweeper(s)} style={{ cursor: "pointer" }}>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email || id}</div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <button className="text-sm text-primary" onClick={() => { setSelectedSweeper(s); setShowAssignModal(true); }}>
                        Assign
                      </button>
                      <button className="text-sm text-gray-500" onClick={() => handleSelectSweeper(s)}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Map area */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium">Map</h2>
            <div className="flex items-center space-x-2">
              <Button variant={isDrawingMode && drawingType === GEOFENCE_TYPES.POLYGON ? "solid" : "outline"} color="primary" size="sm" onClick={startDrawingPolygon}>
                <FaDrawPolygon className="mr-1" /> Draw Area
              </Button>
              <Button variant={isDrawingMode && drawingType === GEOFENCE_TYPES.CIRCLE ? "solid" : "outline"} color="success" size="sm" onClick={startDrawingCircle}>
                <FaCircle className="mr-1" /> Draw Radius
              </Button>
              {isDrawingMode && <Button variant="outline" color="danger" size="sm" onClick={cancelDrawing}>Cancel</Button>}
              <Button variant="outline" color="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <FaUpload className="mr-1" /> Import
                <input ref={fileInputRef} type="file" accept=".json,.geojson" className="hidden" onChange={handleFileImport} />
              </Button>
            </div>
          </div>

          <div className="h-96 mb-4">
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
              <DrawingManager onLoad={handleDrawingManagerLoad} onOverlayComplete={handleOverlayComplete} options={{ drawingControl: false }} />

              {/* Show displayed geofence as Polygon */}
              {displayedGeofence && displayedGeofence.geofence && displayedGeofence.geofence.length > 2 && (
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

              {/* Show checkpoints */}
              {displayedGeofence &&
                displayedGeofence.checkpoints &&
                displayedGeofence.checkpoints.map((cp, idx) => (
                  <Marker key={idx} position={{ lat: cp.lat, lng: cp.lng }} />
                ))}

              {/* InfoWindow */}
              {infoWindow.visible && infoWindow.position && (
                <InfoWindow position={infoWindow.position} onCloseClick={() => setInfoWindow({ ...infoWindow, visible: false })}>
                  <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">{selectedSweeper ? `Selected: ${selectedSweeper.name}` : "Select a sweeper to view their geofence"}</p>
            </div>

            <div className="flex space-x-2">
              <Button color="primary" onClick={() => {
                if (displayedGeofence && displayedGeofence.geofence && displayedGeofence.geofence.length > 2 && mapInstance) {
                  const bounds = new window.google.maps.LatLngBounds();
                  displayedGeofence.geofence.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
                  mapInstance.fitBounds(bounds);
                }
              }}>
                Zoom to Assignment
              </Button>
            </div>
          </div>
        </Card>

        {/* Custom Geofences panel (create-only + list) */}
        <Card className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Custom Geofences</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" color="secondary" size="sm" onClick={fetchCustomGeofences}><FaSync /></Button>
            </div>
          </div>

          <div className="mb-3">
            <Button color="black" className="w-full" onClick={() => { startDrawingPolygon(); }}>
              <FaPlus className="mr-2" /> Add Custom Geofence
            </Button>
            <p className="text-xs text-gray-500 mt-2">Draw on the map, then save. Saved geofences can be assigned to any sweeper.</p>
          </div>

          <div className="overflow-y-auto max-h-72 space-y-2">
            {customGeofences.length === 0 && <div className="text-sm text-gray-500">No custom geofences</div>}
            {customGeofences.map((gf) => {
              const id = gf._id || gf.id;
              return (
                <div key={id} className="border rounded p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{gf.name || "Unnamed"}</div>
                      <div className="text-xs text-gray-500">{gf.zone || "Zone not set"}</div>
                      <div className="text-xs text-gray-600">Points: {(gf.geofence || gf.path || []).length}</div>
                    </div>
                    <div className="space-y-1">
                      <button
                        className="text-primary text-sm"
                        onClick={() => {
                          // view this custom geofence on map (fit bounds)
                          if (mapInstance && (gf.geofence || gf.path) && (gf.geofence || gf.path).length > 0) {
                            const path = gf.geofence || gf.path;
                            const bounds = new window.google.maps.LatLngBounds();
                            path.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
                            mapInstance.fitBounds(bounds);
                          }
                          setDisplayedGeofence(gf);
                        }}
                      >
                        View
                      </button>

                      <button className="text-green-700 text-sm" onClick={() => assignCustomFromList(id)}>Assign</button>

                      <button className="text-red-700 text-sm" onClick={() => deleteCustomGeofence(gf)}>Delete</button>
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
        <div className="px-6 py-4 bg-primary text-white">
          <h3 className="text-lg font-medium">Save Custom Geofence</h3>
        </div>
        <div className="p-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Name</label>
          <input value={newGeofenceName} onChange={(e) => setNewGeofenceName(e.target.value)} className="w-full p-3 border rounded" placeholder="Enter geofence name" />
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" color="default" onClick={() => { setShowSaveGeofenceModal(false); if (selectedGeofenceTemp?.overlay) selectedGeofenceTemp.overlay.setMap(null); setSelectedGeofenceTemp(null); }}>Cancel</Button>
            <Button color="black" onClick={saveCustomGeofence}><FaSave className="mr-1" /> Save</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <div className="px-6 py-4 bg-primary text-white">
          <h3 className="text-lg font-medium">Assign Geofence to {selectedSweeper?.name || "Sweeper"}</h3>
        </div>
        <div className="p-6">
          <p className="mb-3 text-sm text-gray-700">Choose geofence to assign:</p>

          <div className="mb-4">
            <label className="block font-medium mb-2">Use currently displayed assignment</label>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div>
                <div className="font-medium">{displayedGeofence?.name || "No displayed geofence"}</div>
                <div className="text-xs text-gray-500">Points: {displayedGeofence?.geofence?.length || 0}</div>
              </div>
              <div>
                <Button color="primary" onClick={() => {
                  if (!displayedGeofence) { setError("No displayed geofence to assign"); return; }
                  assignGeofenceToSweeper({ geofenceObj: displayedGeofence });
                }}>Assign</Button>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Or pick a custom geofence</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {customGeofences.length === 0 && <div className="text-sm text-gray-500">No custom geofences</div>}
              {customGeofences.map((gf) => {
                const id = gf._id || gf.id;
                return (
                  <div key={id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <div className="font-medium">{gf.name}</div>
                      <div className="text-xs text-gray-500">Points: {(gf.geofence || gf.path || []).length}</div>
                    </div>
                    <div>
                      <Button color="primary" onClick={() => assignCustomFromList(id)}>Assign</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" color="default" onClick={() => setShowAssignModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignRoute;