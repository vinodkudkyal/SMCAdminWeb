// // App.jsx
// import './index.css';
// import React, { useState } from 'react';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import DashboardLayout from './layouts/DashboardLayout';
// import Login from './Login';

// // Sweeper SWEEPERtracker
// import SweeperDashboard from './pages/Sweeper/Dashboard';
// import MyRoutes from './pages/Sweeper/MyRoutes';
// import History from './pages/Sweeper/History';

// // Admin SWEEPERtracker
// import SweeperList from './pages/Admin/SweeperList';
// import AssignRoute from './pages/Admin/AssignRoute';
// import Monitoring from './pages/Admin/Monitoring';
// import DetectionLogs from './pages/Admin/DetectionLogs';
// import AttendanceRecords from './pages/Admin/AttendanceRecords';
// import Reports from './pages/Admin/Reports';

// const AppContent = () => {
//   const { isLoggedIn, userRole, logout } = useAuth();
//   const [activeTab, setActiveTab] = useState(
//     userRole === "admin" ? "sweeperList" : "dashboard"
//   );

//   if (!isLoggedIn) {
//     return <Login />;
//   }

//   // Render content based on active tab and user role
//   const renderContent = () => {
//     // Sweeper SWEEPERtracker
//     if (userRole === "sweeper") {
//       switch (activeTab) {
//         case "dashboard":
//           return <SweeperDashboard />;
//         case "routes":
//           return <MyRoutes />;
//         case "history":
//           return <History />;
//         default:
//           return <SweeperDashboard />;
//       }
//     }
    
//     // Admin SWEEPERtracker
//     if (userRole === "admin") {
//       switch (activeTab) {
//         case "sweeperList":
//           return <SweeperList />;
//         case "assignRoute":
//           return <AssignRoute />;
//         case "monitoring":
//           return <Monitoring />;
//         case "detectionLogs":
//           return <DetectionLogs />;
//         case "attendance":
//           return <AttendanceRecords />;
//         case "reports":
//           return <Reports />;
//         default:
//           return <SweeperList />;
//       }
//     }
//   };

//   return (
//     <DashboardLayout
//       userRole={userRole}
//       activeTab={activeTab}
//       setActiveTab={setActiveTab}
//       handleLogout={logout}
//     >
//       {renderContent()}
//     </DashboardLayout>
//   );
// };

// const App = () => {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// };

// export default App;

// app.jsx
import './index.css';
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './Login';

// Admin SWEEPERtracker (kept)
import SweeperList from './pages/Admin/SweeperList';
import AssignRoute from './pages/Admin/AssignRoute';
import AttendanceRecords from './pages/Admin/AttendanceRecords';

const AppContent = () => {
  const { isLoggedIn, userRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sweeperList');

  if (!isLoggedIn) {
    return <Login />;
  }

  // Only admin-related content remains
  const renderContent = () => {
    if (userRole !== 'admin') {
      return (
        <div style={{ padding: 20 }}>
          <h2>Access denied</h2>
          <p>You do not have permission to view this section.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'sweeperList':
        return <SweeperList />;
      case 'assignRoute':
        return <AssignRoute />;
      case 'attendance':
        return <AttendanceRecords />;
      default:
        return <SweeperList />;
    }
  };

  return (
    <DashboardLayout
      userRole={userRole}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      handleLogout={logout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;