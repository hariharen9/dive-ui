import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { Sparkles, Star, Heart, Zap, Gift, Crown, Gem, Rocket } from 'lucide-react';

interface EasterEggProps {
  id: string;
  trigger: 'click' | 'hover' | 'konami' | 'sequence';
  element?: 'hidden' | 'visible';
  sequence?: string[];
  position?: 'fixed' | 'absolute' | 'relative';
  className?: string;
  children?: React.ReactNode;
  onDiscovered?: () => void;
}

const EasterEgg: React.FC<EasterEggProps> = ({
  id,
  trigger,
  element = 'hidden',
  sequence = [],
  position = 'relative',
  className = '',
  children,
  onDiscovered,
}) => {
  const { easterEggsFound, addEasterEgg, playSound, triggerHaptic } = usePreferences();
  const [isRevealed, setIsRevealed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFoundMessage, setShowFoundMessage] = useState(false);

  const isFound = easterEggsFound.includes(id);

  // Konami Code: ↑↑↓↓←→←→BA
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

  useEffect(() => {
    if (trigger === 'konami') {
      const handleKeyDown = (e: KeyboardEvent) => {
        setKeySequence(prev => {
          const newSequence = [...prev, e.code].slice(-konamiCode.length);
          
          if (JSON.stringify(newSequence) === JSON.stringify(konamiCode)) {
            discoverEasterEgg();
            return [];
          }
          
          return newSequence;
        });
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [trigger]);

  useEffect(() => {
    if (trigger === 'sequence' && sequence.length > 0) {
      const handleKeyDown = (e: KeyboardEvent) => {
        setKeySequence(prev => {
          const newSequence = [...prev, e.code].slice(-sequence.length);
          
          if (JSON.stringify(newSequence) === JSON.stringify(sequence)) {
            discoverEasterEgg();
            return [];
          }
          
          return newSequence;
        });
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [trigger, sequence]);

  const discoverEasterEgg = () => {
    if (isFound) return;

    addEasterEgg(id);
    setIsRevealed(true);
    setShowCelebration(true);
    setShowFoundMessage(true);
    playSound('discovery');
    triggerHaptic('medium');
    
    if (onDiscovered) {
      onDiscovered();
    }

    // Hide celebration after animation
    setTimeout(() => setShowCelebration(false), 3000);
    
    // Hide "Easter Egg Found!" message after 7 seconds
    setTimeout(() => setShowFoundMessage(false), 7000);
  };

  const handleClick = () => {
    if (trigger === 'click') {
      const requiredClicks = id.includes('multi') ? 5 : 1;
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);

      if (newClickCount >= requiredClicks) {
        discoverEasterEgg();
        setClickCount(0);
      } else {
        playSound('click');
        triggerHaptic('light');
      }
    }
  };

  const handleHover = () => {
    if (trigger === 'hover' && !isFound) {
      setTimeout(() => discoverEasterEgg(), 1000);
    }
  };

  const getEasterEggIcon = () => {
    const icons = [Sparkles, Star, Heart, Zap, Gift, Crown, Gem, Rocket];
    const IconComponent = icons[id.length % icons.length];
    return <IconComponent size={20} />;
  };

  const CelebrationEffect = () => (
    <div className={`fixed inset-0 pointer-events-none z-50 ${showCelebration ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl animate-bounce">🎉</div>
      </div>
      {/* Confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random()}s`,
          }}
        />
      ))}
    </div>
  );

  if (element === 'hidden') {
    return (
      <>
        <div
          className={`${position} ${className} ${
            isFound && showFoundMessage ? 'opacity-100' : 'opacity-0'
          } transition-all duration-1000 cursor-pointer group`}
          onClick={handleClick}
          onMouseEnter={handleHover}
          style={{
            width: isFound && showFoundMessage ? 'auto' : '20px',
            height: isFound && showFoundMessage ? 'auto' : '20px',
          }}
        >
          {isFound && showFoundMessage && (
            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              {getEasterEggIcon()}
              <span>Easter Egg Found!</span>
            </div>
          )}
        </div>
        <CelebrationEffect />
      </>
    );
  }

  return (
    <>
      <div
        className={`${position} ${className} cursor-pointer transition-all duration-300 ${
          isFound ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
        }`}
        onClick={handleClick}
        onMouseEnter={handleHover}
      >
        {children}
        {isFound && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse">
            ✨
          </div>
        )}
      </div>
      <CelebrationEffect />
    </>
  );
};

export default EasterEgg;