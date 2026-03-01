import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

const MobileLayoutIndicator: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Show indicator briefly when switching layouts
      if (mobile !== isMobile) {
        setShowIndicator(true);
        setTimeout(() => setShowIndicator(false), 3800);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[1200] md:hidden">
      <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg animate-bounce">
        {isMobile ? (
          <>
            <Smartphone size={16} />
            <span className="text-sm font-medium">Mobile Layout</span>
          </>
        ) : (
          <>
            <Monitor size={16} />
            <span className="text-sm font-medium">Desktop Layout</span>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileLayoutIndicator;