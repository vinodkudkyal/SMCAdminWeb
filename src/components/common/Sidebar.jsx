import React from "react";
import { motion } from "framer-motion";
import { 
  FaUser, 
  FaHistory, 
  FaRoute, 
  FaChartLine, 
  FaSignOutAlt 
} from "react-icons/fa";

const NavItem = ({ active, icon, label, onClick, className = "" }) => {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className={`
        flex items-center px-6 py-3 cursor-pointer ${className}
        ${active 
          ? "text-primary bg-primary/5 border-l-3 border-primary" 
          : "text-gray-700 hover:bg-gray-50 border-l-3 border-transparent"}
      `}
      onClick={onClick}
    >
      {icon}
      <span className={`ml-3 ${active ? "font-medium" : ""}`}>{label}</span>
    </motion.div>
  );
};

const Sidebar = ({ open, activeTab, setActiveTab, userRole, handleLogout, navigate, onClose, isVisible }) => {
  // Animation variants for the sidebar
  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const sweeperNavItems = [
    { id: "dashboard", icon: <FaChartLine />, label: "Dashboard" },
    { id: "routes", icon: <FaRoute />, label: "My Routes" },
    { id: "history", icon: <FaHistory />, label: "History" },
  ];

  const adminNavItems = [
    { id: "sweeperList", icon: <FaUser />, label: "Sweeper List" },
    { id: "assignRoute", icon: <FaRoute />, label: "Assign Route" },
    { id: "attendance", icon: <FaChartLine />, label: "Attendance Records" },
  ];

  const navItems = userRole === "admin" ? adminNavItems : sweeperNavItems;

  // Handle navigation when a sidebar item is clicked
  const handleNavigation = (tabId) => {
    setActiveTab(tabId);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {  // 768px is Tailwind's md breakpoint
      onClose?.();  // Close the sidebar if onClose is provided
    }
    
    // If using React Router, you can uncomment this to use proper routing
    // navigate(`/${userRole}/${tabId}`);
    
    // For custom navigation system without React Router
    // This ensures the parent component knows which page to render
    if (typeof window !== 'undefined') {
      // You can use a URL hash for bookmarkable pages
      window.location.hash = `#${userRole}/${tabId}`;
      
      // Optional: Dispatch a custom event for other components to listen to
      const navigationEvent = new CustomEvent('navigationChange', { 
        detail: { 
          userRole, 
          page: tabId 
        } 
      });
      document.dispatchEvent(navigationEvent);
    }
  };

  return (
    <motion.div
      initial="closed"
      animate={isVisible ? "open" : "closed"}
      variants={sidebarVariants}
      className={`
        bg-white shadow-sm w-64 flex flex-col py-6 overflow-hidden
        fixed left-0 top-16 bottom-0 z-40
      `}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            active={activeTab === item.id}
            icon={item.icon}
            label={item.label}
            onClick={() => handleNavigation(item.id)}
          />
        ))}
      </div>

      <div className="px-6">
        <NavItem
          icon={<FaSignOutAlt />}
          label="Logout"
          onClick={() => {
            if (window.innerWidth < 768) {  // Close on mobile
              onClose?.();
            }
            handleLogout();
          }}
          className="mt-4 text-danger"
        />
      </div>
    </motion.div>
  );
};

export default Sidebar;