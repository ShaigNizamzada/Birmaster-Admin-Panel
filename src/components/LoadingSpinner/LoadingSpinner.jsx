import React from "react";
import "./LoadingSpinner.scss";

const LoadingSpinner = ({ size = "medium", className = "" }) => {
  return (
    <div className={`loading-spinner-container ${className}`}>
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>


      </div>
    </div>
  );
};

export default LoadingSpinner;