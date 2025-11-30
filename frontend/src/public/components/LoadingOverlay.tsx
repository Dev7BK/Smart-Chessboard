import React from "react";
import { useLoader } from "../../context/loading/useLoader";
import "../scss/loadingOverlay.scss";

const LoadingOverlay: React.FC = () => {
  const { isLoading } = useLoader();
  if (!isLoading) return null;

  return (
    <div className="loading-overlay" aria-live="polite" aria-busy="true">
      <div className="loading-box">
        <div className="spinner" />
        <div className="loading-text">Lädt...</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
