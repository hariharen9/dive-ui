import React, { useState, useRef, useEffect, Suspense } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  className?: string;
}

const LazyLoad: React.FC<LazyLoadProps> = ({ children, fallback, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // We only care about the first time it becomes visible
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Stop observing once it's visible
          if (elementRef.current && observerRef.current) {
            observerRef.current.unobserve(elementRef.current);
          }
        }
      },
      {
        rootMargin: '200px 0px', // Start loading 200px before it enters the viewport
      }
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current && observerRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    };
  }, []);

  return (
    <div ref={elementRef} className={className} style={{ minHeight: isVisible ? 'auto' : '100vh' }}>
      {isVisible ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
};

export default LazyLoad;
