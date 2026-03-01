import React, { useRef, useEffect } from 'react';

interface InteractiveDotsProps {
  dotColorLight?: string;
  dotColorDark?: string;
  radius?: number;
  hoverRadius?: number;
  gap?: number;
  mousePosition?: { x: number; y: number };
}

const InteractiveDots: React.FC<InteractiveDotsProps> = ({
  dotColorLight = '#e5e7eb', // gray-200
  dotColorDark = '#374151', // gray-700
  radius = 1,
  hoverRadius = 150,
  gap = 16,
  mousePosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  // If the parent is controlling the mouse, update our internal ref on prop change.
  useEffect(() => {
    if (mousePosition) {
      mouse.current = mousePosition;
    }
  }, [mousePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create an off-screen canvas for the static background
    if (!backgroundCanvasRef.current) {
        backgroundCanvasRef.current = document.createElement('canvas');
    }
    const backgroundCanvas = backgroundCanvasRef.current;
    const bgCtx = backgroundCanvas.getContext('2d');
    if (!bgCtx) return;

    let animationFrameId: number;
    let dots: { x: number; y: number; originalSize: number }[] = [];
    let isDarkMode = document.documentElement.classList.contains('dark');
    
    const getDotColor = () => (isDarkMode ? dotColorDark : dotColorLight);

    const drawBackground = () => {
        bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        bgCtx.fillStyle = getDotColor();
        dots.forEach(dot => {
            bgCtx.beginPath();
            bgCtx.arc(dot.x, dot.y, dot.originalSize, 0, 2 * Math.PI);
            bgCtx.fill();
        });
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      backgroundCanvas.width = rect.width * dpr;
      backgroundCanvas.height = rect.height * dpr;
      bgCtx.scale(dpr, dpr);
      
      dots = [];
      for (let x = gap / 2; x < rect.width; x += gap) {
        for (let y = gap / 2; y < rect.height; y += gap) {
          dots.push({ x, y, originalSize: radius });
        }
      }
      drawBackground();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    
    const handleMouseLeave = () => {
        mouse.current = { x: -9999, y: -9999 };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the pre-rendered background
      ctx.drawImage(backgroundCanvas, 0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      
      ctx.fillStyle = getDotColor();

      // Only draw the dots that are being hovered over
      dots.forEach(dot => {
        const dx = dot.x - mouse.current.x;
        const dy = dot.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < hoverRadius) {
          const scaleFactor = (hoverRadius - dist) / hoverRadius;
          const easedScale = 1 - Math.pow(1 - scaleFactor, 3);
          const newSize = dot.originalSize + easedScale * (radius * 4);
          
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, newSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    
    const handleThemeChange = (mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class') {
                isDarkMode = (mutation.target as HTMLElement).classList.contains('dark');
                // Redraw background on theme change
                drawBackground();
            }
        }
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true });

    resizeCanvas();
    animate();
    
    const debouncedResize = debounce(resizeCanvas, 100);
    window.addEventListener('resize', debouncedResize);
    
    if (!mousePosition) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', debouncedResize);
      if (!mousePosition) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      observer.disconnect();
    };
  }, [dotColorLight, dotColorDark, radius, hoverRadius, gap, mousePosition]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 w-full h-full [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
    />
  );
};

function debounce(fn: (...args: any[]) => void, wait: number) {
  let t: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default InteractiveDots;

