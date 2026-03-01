import React, { useState, useEffect, useRef } from 'react';
import './AnimatedWelcome.css';

const AnimatedWelcome: React.FC = () => {
  const title = "Hariharen's Portfolio";
  const [displayText, setDisplayText] = useState(Array(title.length).fill('\u00A0'));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}_+-=;:\'",.<>?/|\\';
    const initialRenderDelay = 1500; // Wait for the CRT scanline to start

    // Store all timeout/interval IDs for cleanup
    const timeoutIds: NodeJS.Timeout[] = [];

    title.split('').forEach((char, index) => {
      if (char === ' ') {
        // Handle spaces immediately without animation
        setDisplayText(prev => {
            const newText = [...prev];
            newText[index] = '\u00A0';
            return newText;
        });
        return;
      }
      
      const revealDelay = index * 100;  // Stagger the start of each character's animation
      const animDuration = 500;        // How long each character should animate
      const animInterval = 40;         // The speed of the character cycling

      // Set a timeout to start the animation for this specific character
      const startTimeout = setTimeout(() => {
        let iterations = 0;
        const maxIterations = Math.floor(animDuration / animInterval);

        const intervalId = setInterval(() => {
          // If we've reached the end of the animation duration for this char
          if (iterations >= maxIterations) {
            clearInterval(intervalId);
            // Set the final, correct character
            setDisplayText(prev => {
              const newText = [...prev];
              newText[index] = title[index];
              return newText;
            });
          } else {
            // Otherwise, display a random character from the charset
            setDisplayText(prev => {
              const newText = [...prev];
              newText[index] = charset[Math.floor(Math.random() * charset.length)];
              return newText;
            });
            iterations++;
          }
        }, animInterval);

        timeoutIds.push(intervalId); // Add for cleanup
      }, initialRenderDelay + revealDelay);
      
      timeoutIds.push(startTimeout); // Add for cleanup
    });

    // Make the component visible to trigger the CSS scanline animation
    if (containerRef.current) {
      containerRef.current.style.opacity = '1';
    }

    // Cleanup function to run when the component unmounts
    return () => {
      timeoutIds.forEach(id => clearTimeout(id)); // This clears both timeouts and intervals
    };
  }, [title]); // Dependency array ensures this runs if the title prop ever changes

  const spaceIndex = title.indexOf(' ');

  return (
    <div ref={containerRef} className="glitch-container" style={{ opacity: 0, transition: 'opacity 0.5s' }}>
      <div className="glitch-text flex flex-col md:flex-row md:space-x-4 items-center justify-center">
        <div className="flex">
          {displayText.slice(0, spaceIndex).map((char, index) => (
            <span key={index} className="glitch-char">{char}</span>
          ))}
        </div>
        <div className="flex">
          {displayText.slice(spaceIndex + 1).map((char, index) => (
            <span key={spaceIndex + 1 + index} className="glitch-char">{char}</span>
          ))}
        </div>
      </div>
      <div className="text-sm" style={{ animation: 'reveal-text 2s 3s forwards', opacity: '0', marginTop: '1.5rem' }}>
        <span className="text-green-600 dark:text-green-400">→</span> <span className="text-yellow-600 dark:text-yellow-400 font-medium">Welcome to my interactive terminal!</span>
      </div>
      <div className="text-xs sm:text-sm" style={{ animation: 'reveal-text 2s 3.5s forwards', opacity: '0' }}>
        <span className="text-gray-500 dark:text-gray-400">Type</span> <span className="text-cyan-600 dark:text-cyan-400 font-bold">help</span> <span className="text-gray-500 dark:text-gray-400">to get started</span>
      </div>

    </div>
  );
};

export default AnimatedWelcome;
