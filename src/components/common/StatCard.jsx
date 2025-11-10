import React from "react";
import { motion } from "framer-motion";

const StatCard = ({ icon, title, value, subtitle, color = "primary", className = "" }) => {
  const colorVariants = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    secondary: "bg-secondary/10 text-secondary",
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-lg shadow-card flex items-center p-6 ${className}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${colorVariants[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-semibold mb-1">{value}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
        {title && <div className="text-xs font-medium mt-2">{title}</div>}
      </div>
    </motion.div>
  );
};

export default StatCard;