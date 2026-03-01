import React, { useState, useEffect } from 'react';
import InfiniteMenu from './InfiniteMenu';
import { Loader2 } from 'lucide-react';

interface SphereViewItem {
  id: string | number;
  title: string;
  description: string;
  image: string;
  link?: string;
  github?: string;
  demo?: string;
}

interface SphereViewProps {
  items: SphereViewItem[];
  className?: string;
  type?: 'projects' | 'blogs' | 'skills'; // For conditional button logic
}

const SphereView: React.FC<SphereViewProps> = ({ items, className = '', type = 'projects' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Transform items to the format expected by InfiniteMenu
  const menuItems = items.map(item => ({
    image: item.image,
    link: item.demo || item.github || item.link || '#',
    title: item.title,
    description: item.description,
    github: item.github,
    demo: item.demo,
    type: type
  }));

  useEffect(() => {
    // Preload all images and set up WebGL context
    const preloadImages = async () => {
      const imagePromises = items.map(item => 
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
          img.src = item.image;
        })
      );

      try {
        await Promise.all(imagePromises);
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.warn('Some images failed to preload');
        setIsLoading(false);
      }
    };

    preloadImages();
  }, [items]);

  const handleInitialized = () => {
    setIsInitialized(true);
  };

  return (
    <div className={`w-full h-[600px] md:h-[600px] h-[800px] relative ${className}`}>
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm rounded-xl z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="glass-card p-6 rounded-2xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400 mb-2" />
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Loading Interactive Sphere...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Preparing {items.length} items
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Infinite Menu Component */}
      <div className={`w-full h-full transition-opacity duration-500 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      }`}>
        <InfiniteMenu 
          items={menuItems} 
          onInitialized={handleInitialized}
        />
      </div>
    </div>
  );
};

export default SphereView;