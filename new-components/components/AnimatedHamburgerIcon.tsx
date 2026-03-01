import React from 'react';
import { cn } from '../../lib/utils';

interface AnimatedHamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const AnimatedHamburgerIcon: React.FC<AnimatedHamburgerIconProps> = ({ isOpen, onClick, className }) => {
  const lineBase = "block absolute h-[1.5px] bg-current transform transition-all duration-500 ease-[cubic-bezier(0.7,0,0.3,1)]";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group",
        "hover:bg-gray-100/50 dark:hover:bg-gray-800/50 active:scale-90",
        className
      )}
      aria-label="Toggle menu"
    >
      <div className="relative w-6 h-5">
        {/* Top line */}
        <span
          className={cn(
            lineBase,
            "w-6",
            isOpen
              ? "rotate-45 top-1/2 -translate-y-1/2"
              : "top-1 group-hover:top-0.5"
          )}
        />
        
        {/* Bottom line - Offset and dynamic width */}
        <span
          className={cn(
            lineBase,
            "right-0",
            isOpen
              ? "-rotate-45 top-1/2 -translate-y-1/2 w-6"
              : "bottom-1 w-4 group-hover:w-6 group-hover:bottom-0.5"
          )}
        />
      </div>
    </button>
  );
};
