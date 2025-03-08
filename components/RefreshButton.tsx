import React from "react";

interface RefreshButtonProps {
  onClick: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick }) => {
  return (
    <button onClick={onClick} className="refresh-btn text-white hover:bg-blue-600">
      Refresh
    </button>
  );
};