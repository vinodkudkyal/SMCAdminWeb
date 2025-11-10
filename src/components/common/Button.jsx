import React from "react";

// Define theme colors with default values to prevent undefined errors
const THEME_COLORS = {
  primary: {
    solid: "bg-primary hover:bg-primary/90 text-white",
    outline: "border border-primary text-primary hover:bg-primary/10"
  },
  secondary: {
    solid: "bg-secondary hover:bg-secondary/90 text-white",
    outline: "border border-secondary text-secondary hover:bg-secondary/10"
  },
  success: {
    solid: "bg-success hover:bg-success/90 text-white",
    outline: "border border-success text-success hover:bg-success/10"
  },
  danger: {
    solid: "bg-danger hover:bg-danger/90 text-white",
    outline: "border border-danger text-danger hover:bg-danger/10"
  },
  warning: {
    solid: "bg-warning hover:bg-warning/90 text-white",
    outline: "border border-warning text-warning hover:bg-warning/10"
  },
  default: {
    solid: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  }
};

// Size variants
const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base"
};

const Button = ({
  children,
  onClick,
  type = "button",
  color = "default",
  variant = "solid",
  size = "md",
  className = "",
  iconOnly = false,
  disabled = false,
  title = "",
  ...props
}) => {
  // Safety check to ensure color exists in theme, fallback to default
  const safeColor = THEME_COLORS[color] ? color : "default";
  
  // Get the appropriate color classes
  const colorClasses = THEME_COLORS[safeColor][variant] || THEME_COLORS.default.solid;
  
  // Get the size classes
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  
  // Icon-only modifier
  const iconOnlyClasses = iconOnly ? "!px-2 flex items-center justify-center" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${colorClasses}
        ${sizeClasses}
        ${iconOnlyClasses}
        rounded-lg font-medium transition-colors
        flex items-center justify-center
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;