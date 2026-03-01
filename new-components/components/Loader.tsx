import React from 'react';
import './Loader.css';

interface LoaderProps {
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false }) => {
  // If it's not full screen (e.g. for a section), render a smaller inline version
  if (!fullScreen) {
    return (
      <div className="flex justify-center items-center py-12 w-full">
        <div className="relative">
          <div className="spinner-ring" style={{ width: '40px', height: '40px', borderWidth: '2px' }}></div>
          <div className="spinner-core" style={{ width: '6px', height: '6px' }}></div>
        </div>
      </div>
    );
  }

  // Default Full Screen Loader
  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="relative">
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <span className="loading-text">System Initializing</span>
          <div className="loading-bar-container">
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;