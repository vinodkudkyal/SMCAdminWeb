import React from "react";
import styled from "styled-components";

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #f0f0f0;
`;

// Enhanced MapView component with a more visual representation
const MapView = ({
  selectedRoute,
  selectedCheckpoint,
  setSelectedCheckpoint,
  currentLocation,
  isWithinGeofence
}) => {
  return (
    <MapContainer>
      {/* Styled map simulation with SVG elements */}
      <svg width="100%" height="100%" viewBox="0 0 800 400" style={{backgroundColor: "#E8F0F7"}}>
        {/* Draw road */}
        <path
          d="M100,200 C150,150 250,150 350,200 S550,250 700,200"
          stroke="#A0A0A0"
          strokeWidth="30"
          fill="none"
        />
        
        {/* Route corridor */}
        <path
          d="M100,200 C150,150 250,150 350,200 S550,250 700,200"
          stroke="#1976d2"
          strokeWidth="50"
          fill="none"
          opacity="0.2"
          strokeLinecap="round"
        />
        
        {/* Route path */}
        <path
          d="M100,200 C150,150 250,150 350,200 S550,250 700,200"
          stroke="#4caf50"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Checkpoints */}
        <circle cx="100" cy="200" r="10" fill="#4caf50" /> {/* Start */}
        <circle cx="350" cy="200" r="10" fill="#ff9800" /> {/* Middle */}
        <circle cx="700" cy="200" r="10" fill="#f44336" /> {/* End */}
        
        {/* Current location */}
        <circle 
          cx="350" 
          cy="200" 
          r="15" 
          fill={isWithinGeofence ? "#2196f3" : "#9c27b0"}
        >
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Checkpoint labels */}
        <text x="100" y="170" fontSize="12" fill="#333" textAnchor="middle">Start Point</text>
        <text x="350" y="170" fontSize="12" fill="#333" textAnchor="middle">Midway Point</text>
        <text x="700" y="170" fontSize="12" fill="#333" textAnchor="middle">End Point</text>
      </svg>
      
      {/* Status indicator */}
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        fontSize: "14px"
      }}>
        <span style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          marginRight: "8px",
          backgroundColor: isWithinGeofence ? "#4caf50" : "#f44336",
        }}></span>
        {isWithinGeofence ? "Within route corridor" : "Outside route corridor"}
      </div>
      
      {/* Route info */}
      <div style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        backgroundColor: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontSize: "14px"
      }}>
        <div><strong>Route:</strong> {selectedRoute?.name || "Loading..."}</div>
        <div><strong>Progress:</strong> {selectedRoute ? (selectedRoute.progress * 100).toFixed(0) : 0}%</div>
      </div>
    </MapContainer>
  );
};

export default MapView;