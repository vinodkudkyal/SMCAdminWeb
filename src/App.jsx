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