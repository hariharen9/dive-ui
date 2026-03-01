import React from 'react';
import './ScrollIndicator.css';

const ScrollIndicator: React.FC = () => {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
      <div className="mouse">
        <div className="scroller"></div>
      </div>
    </div>
  );
};

export default ScrollIndicator;