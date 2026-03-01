import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  className, 
  fallbackSrc = '/placeholder.webp',
  loading = 'lazy', // Default to native lazy loading
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state if src changes
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { 
        rootMargin: '200px', // Start loading 200px before the image enters the viewport
        threshold: 0.01 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading Skeleton / Blur - Only shows when image is in view and still loading */}
      {isInView && isLoading && (
        <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm animate-pulse flex items-center justify-center z-10">
           <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Only render the img tag once the container is near the viewport */}
      {isInView && (
        <img
          {...props}
          src={imgSrc}
          alt={alt}
          loading={loading}
          onError={handleError}
          onLoad={handleLoad}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${props.className || ''}`}
        />
      )}

      {/* Fallback Icon Overlay */}
      {hasError && !imgSrc && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500">
          <ImageOff size={32} className="mb-2" />
          <span className="text-xs font-mono">ASSET_OFFLINE</span>
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;