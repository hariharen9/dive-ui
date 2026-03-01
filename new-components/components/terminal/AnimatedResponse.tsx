import React, { useState, useEffect } from 'react';

interface AnimatedResponseProps {
  frames: string[];
  delay?: number;
}

const AnimatedResponse: React.FC<AnimatedResponseProps> = ({ frames, delay = 300 }) => {
  const [renderedFrames, setRenderedFrames] = useState<string[]>([]);

  useEffect(() => {
    // Don't animate if the user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setRenderedFrames(frames);
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];
    frames.forEach((frame, index) => {
      const timeout = setTimeout(() => {
        setRenderedFrames(prev => [...prev, frame]);
      }, index * delay);
      timeouts.push(timeout);
    });

    // Cleanup timeouts on component unmount
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [frames, delay]);

  return (
    <div>
      {renderedFrames.map((frame, index) => (
        <div key={index} className="animate-fade-in">{frame}</div>
      ))}
    </div>
  );
};

export default AnimatedResponse;
