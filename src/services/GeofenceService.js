import axios from "axios";
import { mockRoutes } from "../utils/mockData";

// Use only the Node.js/Express backend for geofence/route APIs
const API_BASE_URLS = [
  "http://localhost:5001" // Keep this as is
];

// Log which service is being used during initialization
console.log("GeofenceService initialized - Primary API targets:", API_BASE_URLS.join(", "));

// Mock data for fallback when API is unavailable
const MOCK_GEOFENCES = [
  {
    id: "geo1",
    name: "Central Zone",
    type: "polygon",
    path: [
      { lat: 17.672, lng: 75.889 },
      { lat: 17.667, lng: 75.894 },
      { lat: 17.662, lng: 75.890 },
      { lat: 17.668, lng: 75.885 }
    ],
    rules: {
      requiredCheckIns: 3,
      startTime: "08:00",
      endTime: "17:00"
    },
    zone: "central",
    assignedSweepers: ["2"]
  },
  {
    id: "geo2",
    name: "Market Area",
    type: "circle",
    center: { lat: 17.669, lng: 75.891 },
    radius: 300,
    rules: {
      requiredCheckIns: 5,
      startTime: "09:00",
      endTime: "18:00"
    },
    zone: "north",
    assignedSweepers: ["3"]
  }
];

/**
 * Try making an API request to different base URLs until one works
 * @param {Function} apiCall - Function that takes a base URL and returns a promise
 * @param {any} fallbackData - Data to return if all API calls fail
 * @returns {Promise<any>} - API response or fallback data
 */
const tryApiEndpoints = async (apiCall, fallbackData) => {
  let lastError = null;
  
  for (const baseUrl of API_BASE_URLS) {
    try {
      // Modify this to use the correct path format
      const response = await apiCall(`${baseUrl}/api`);
      console.log(`✅ Successfully connected to API at ${baseUrl}/api`);
      return response;
    } catch (error) {
      console.warn(`⚠️ Failed to connect to API at ${baseUrl}/api:`, error.message);
      lastError = error;
    }
  }
  
  console.error("❌ All API endpoints failed, using fallback data", lastError);
  return fallbackData;
};

export const GeofenceService = {
  /**
   * Gets assigned route and geofence for a sweeper
   * @param {string} sweeperId - Sweeper's user ID
   * @returns {Promise<any>} - Route and geofence data
   */
  getAssignedRoute: async (sweeperId) => {
    const fallbackRoute = mockRoutes.find(route => route.id === "1") || mockRoutes[0];
    
    try {
      // Try all possible API endpoints
      const response = await tryApiEndpoints(
        (baseUrl) => axios.get(`${baseUrl}/route?assignedSweeperId=${sweeperId}`),
        { data: [fallbackRoute] }
      );
      
      return response.data[0] || fallbackRoute;
    } catch (error) {
      console.error("Error in getAssignedRoute:", error);
      return fallbackRoute;
    }
  },

  /**
   * Gets all geofences (optionally filtered)
   * @param {Object} filters - Optional filters like zone
   * @returns {Promise<Array>} - Array of geofences
   */
  getAllGeofences: async (filters = {}) => {
    try {
      let queryString = '';
      if (filters.zone) queryString += `?zone=${filters.zone}`;
      if (filters.assignedSweeper) {
        queryString += queryString ? '&' : '?';
        queryString += `assignedSweeper=${filters.assignedSweeper}`;
      }
      
      const response = await tryApiEndpoints(
        (baseUrl) => axios.get(`${baseUrl}/geofence${queryString}`),
        { data: MOCK_GEOFENCES }
      );
      
      return response.data || MOCK_GEOFENCES;
    } catch (error) {
      console.error("Error fetching geofences:", error);
      return MOCK_GEOFENCES;
    }
  },

  /**
   * Creates a new geofence
   * @param {Object} geofenceData - Geofence data to save
   * @returns {Promise<Object>} - Created geofence
   */
  createGeofence: async (geofenceData) => {
    try {
      const response = await tryApiEndpoints(
        (baseUrl) => axios.post(`${baseUrl}/geofence`, geofenceData),
        { 
          data: { 
            geofence: { 
              ...geofenceData, 
              _id: `mock-${Date.now()}`,
              createdAt: new Date().toISOString()
            } 
          } 
        }
      );
      
      return response.data.geofence;
    } catch (error) {
      console.error("Error creating geofence:", error);
      // Return a mock response with the data that was submitted
      return { 
        ...geofenceData, 
        _id: `mock-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
    }
  },

  /**
   * Checks if a sweeper is within their assigned geofence
   * @param {string} sweeperId - Sweeper's user ID
   * @param {object} location - {lat, lng} object with current location
   * @returns {Promise<object>} - Object with inGeofence status and geofence details
   */
  checkGeofence: async (sweeperId, location) => {
    try {
      const response = await tryApiEndpoints(
        (baseUrl) => axios.post(`${baseUrl}/check-geofence`, { sweeperId, location }),
        { 
          data: { 
            inGeofence: Math.random() > 0.5, // Random result for fallback
            message: "Using fallback geofence check" 
          } 
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error checking geofence:", error);
      // Determine if in geofence using the mock data
      const geofences = MOCK_GEOFENCES.filter(g => g.assignedSweepers.includes(sweeperId));
      let inGeofence = false;
      
      for (const geo of geofences) {
        if (geo.type === 'circle') {
          // Simple circle check (not accurate for large areas)
          const distance = calculateDistance(
            location.lat, location.lng,
            geo.center.lat, geo.center.lng
          );
          inGeofence = distance <= geo.radius;
        } else if (geo.type === 'polygon') {
          inGeofence = isPointInPolygon(location, geo.path);
        }
        
        if (inGeofence) break;
      }
      
      return { 
        inGeofence, 
        message: "Fallback geofence check"
      };
    }
  },
  
  /**
   * Update sweeper's attendance and verification count
   * @param {string} userId - Sweeper's user ID
   * @param {object} location - {lat, lng} object with current location
   * @param {object} attendanceData - Optional attendance details
   * @returns {Promise<object>} - Updated verification data
   */
  updateVerification: async (userId, location, attendanceData = {}) => {
    try {
      console.log("updateVerification called with:", { userId, location, attendanceData });
      
      // Ensure date is properly formatted
      const formattedDate = attendanceData.date || new Date().toISOString();
      console.log("Using formatted date:", formattedDate);
      
      const response = await tryApiEndpoints(
        (baseUrl) => axios.post(`${baseUrl}/sweeper/update`, {
          userId,
          lat: location.lat,
          lng: location.lng,
          entered: attendanceData.entered || true,
          exited: attendanceData.exited || false,
          date: formattedDate
        }),
        { 
          data: { 
            // Return a count between 1-3 for mock data
            verificationCount: Math.floor(Math.random() * 3) + 1,
            verified: Math.random() > 0.5
          } 
        }
      );
      
      console.log("updateVerification response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating verification:", error);
      
      // Return mock verification data
      return { 
        verificationCount: Math.floor(Math.random() * 3) + 1, 
        verified: Math.random() > 0.5,
        message: "Using fallback verification data"
      };
    }
  }
};

// Helper function: Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  
  return d; // Distance in meters
}

// Helper function: Check if point is inside polygon
function isPointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length === 0) {
    return false;
  }
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
      (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export default GeofenceService;

