import React from "react";
import { motion } from "framer-motion";

const Card = ({ children, className = "", ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-card p-6 mb-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;