import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import { useJsApiLoader } from "@react-google-maps/api";

import SweeperList from "../pages/Admin/SweeperList";
import AssignRoute from "../pages/Admin/AssignRoute";
import AttendanceRecords from "../pages/Admin/AttendanceRecords";

// Map page names to components (Admin only)
const COMPONENT_MAP = {
  sweeperList: SweeperList,
  assignRoute: AssignRoute,
  attendance: AttendanceRecords,
};

// Components that need Google Maps
const MAPS_COMPONENTS = ["assignRoute"];

// Google Maps libraries
const LIBRARIES = ["drawing", "geometry", "places", "marker"];

// API Key (multiple fallback options)
const GOOGLE_MAPS_API_KEY =
  (typeof process !== "undefined" && process?.env?.REACT_APP_GOOGLE_MAPS_KEY) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_KEY) ||
  (typeof window !== "undefined" && window.__GOOGLE_MAPS_KEY) ||
  "";

const DashboardLayout = ({ handleLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sweeperList");

  // Keep URL clean on reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      window.history.replaceState(null, "", "/");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Handle hash navigation (optional)
  useEffect(() => {
    const updateActiveTabFromHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash && COMPONENT_MAP[hash]) {
        setActiveTab(hash);
      }
    };

    updateActiveTabFromHash();
    window.addEventListener("hashchange", updateActiveTabFromHash);
    return () => window.removeEventListener("hashchange", updateActiveTabFromHash);
  }, []);

  // Function to render the selected admin page
  const renderComponent = () => {
    try {
      const PageComponent = COMPONENT_MAP[activeTab] || SweeperList;
      return <PageComponent />;
    } catch (error) {
      console.error("Error rendering component:", error);
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-medium text-red-700 mb-2">Error Loading Page</h2>
          <p className="text-red-600">
            There was an error loading this page. Please try again or contact support.
          </p>
          <button
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => setActiveTab("sweeperList")}
          >
            Return to Sweeper List
          </button>
        </div>
      );
    }
  };

  // Google Maps Loader
  const { isLoaded: mapsLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const needsMaps = MAPS_COMPONENTS.includes(activeTab);

  // Render with Google Maps guard
  const renderWithMapsGuard = () => {
    if (needsMaps) {
      if (!GOOGLE_MAPS_API_KEY) {
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-red-600">
              Google Maps API key is missing. Please configure it in your environment.
            </p>
          </div>
        );
      }

      if (loadError) {
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-red-600">
              Failed to load Google Maps. Please check your API key and network.
            </p>
          </div>
        );
      }

      if (!mapsLoaded) {
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        );
      }
    }

    return renderComponent();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header userRole="admin" toggleSidebar={toggleSidebar} />

      <div className="flex flex-1">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          open={sidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole="admin"
          handleLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-6 overflow-y-auto transition-all duration-300 ml-0 md:ml-64">
          {renderWithMapsGuard()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
