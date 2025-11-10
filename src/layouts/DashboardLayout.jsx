import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import { useJsApiLoader } from "@react-google-maps/api"; // <-- switched to useJsApiLoader

// Import all page components for both user roles
import Dashboard from "../pages/Sweeper/Dashboard";
import MyRoutes from "../pages/Sweeper/MyRoutes";
import History from "../pages/Sweeper/History";

import SweeperList from "../pages/Admin/SweeperList";
import AssignRoute from "../pages/Admin/AssignRoute";
import Monitoring from "../pages/Admin/Monitoring";
import Reports from "../pages/Admin/Reports";
import AttendanceRecords from "../pages/Admin/AttendanceRecords";
import DetectionLogs from "../pages/Admin/DetectionLogs";

// Component mapping object to easily retrieve components
const COMPONENT_MAP = {
  sweeper: {
    dashboard: Dashboard,
    routes: MyRoutes,
    history: History
  },
  admin: {
    sweeperList: SweeperList,
    assignRoute: AssignRoute,
    monitoring: Monitoring,
    reports: Reports,
    attendance: AttendanceRecords,
    detectionLogs: DetectionLogs,
  }
};

// Identify which components need Google Maps
const MAPS_COMPONENTS = ['assignRoute', 'monitoring'];

// Libraries needed for map features
const LIBRARIES = ["drawing", "geometry", "places", "marker"];

// Runtime-safe API key retrieval:
// - Preferred: set window.__GOOGLE_MAPS_KEY in your index.html (example below).
// - If using a bundler that inlines env vars (CRA/Vite), it will replace process.env at build time.
// Use typeof checks so we don't reference `process` in the browser when it's undefined.
const GOOGLE_MAPS_API_KEY =
  (typeof process !== "undefined" && process?.env?.REACT_APP_GOOGLE_MAPS_KEY) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_KEY) ||
  (typeof window !== "undefined" && window.__GOOGLE_MAPS_KEY) ||
  ""; // empty means loader will fail with a clear message

const DashboardLayout = ({ children, userRole, handleLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // Start closed on mobile
  const [activeTab, setActiveTab] = useState(
    userRole === "admin" ? "sweeperList" : "dashboard"
  );
  
  // Reset URL to home path after refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      window.history.replaceState(null, "", "/");
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Listen for hash changes and navigation events
  useEffect(() => {
    const updateActiveTabFromHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const [hashUserRole, hashPage] = hash.split('/');
        if (hashUserRole === userRole && hashPage) {
          setActiveTab(hashPage);
        }
      }
    };

    updateActiveTabFromHash();
    window.addEventListener('hashchange', updateActiveTabFromHash);

    const handleNavigationEvent = (event) => {
      if (event.detail && event.detail.userRole === userRole) {
        setActiveTab(event.detail.page);
      }
    };
    document.addEventListener('navigationChange', handleNavigationEvent);

    return () => {
      window.removeEventListener('hashchange', updateActiveTabFromHash);
      document.removeEventListener('navigationChange', handleNavigationEvent);
    };
  }, [userRole]);

  // Determine which component to render based on activeTab and userRole
  const renderComponent = () => {
    try {
      const roleComponents = COMPONENT_MAP[userRole];
      
      if (roleComponents && roleComponents[activeTab]) {
        const PageComponent = roleComponents[activeTab];
        return <PageComponent />;
      }
      
      const defaultComponent = userRole === "admin" 
        ? COMPONENT_MAP.admin.sweeperList 
        : COMPONENT_MAP.sweeper.dashboard;
      
      return React.createElement(defaultComponent);
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
            onClick={() => setActiveTab(userRole === "admin" ? "sweeperList" : "dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
  };

  // Check if current component needs Google Maps
  const needsMaps = MAPS_COMPONENTS.includes(activeTab);

  // -------------------------
  // useJsApiLoader (one-time loader)
  // -------------------------
  // Call unconditionally (hooks must run every render). We'll only show a loader UI when the page needs maps.
  const { isLoaded: mapsLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Show loading UI only when the active page requires maps and maps are not yet loaded
  const renderWithMapsGuard = () => {
    if (needsMaps) {
      if (!GOOGLE_MAPS_API_KEY) {
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600">Google Maps API key is missing. Set window.__GOOGLE_MAPS_KEY in index.html or configure your env.</p>
            </div>
          </div>
        );
      }

      if (loadError) {
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600">Failed to load Google Maps. Please check your API key and network.</p>
            </div>
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

      // mapsLoaded is true -> render page that uses maps
      return renderComponent();
    }

    // page doesn't need maps -> render immediately
    return renderComponent();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header userRole={userRole} toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar 
          open={sidebarOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userRole={userRole} 
          handleLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
          isVisible={sidebarOpen}
        />
        
        <main className="flex-1 p-6 overflow-y-auto transition-all duration-300 ml-0 md:ml-64">
          {renderWithMapsGuard()}
        </main>
      </div>
      
    </div>
  );
};

export default DashboardLayout;