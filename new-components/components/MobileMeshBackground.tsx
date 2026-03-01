import React, { useRef, useEffect } from 'react';

interface MobileMeshBackgroundProps {
  cursorForce?: number;
  fixed?: boolean;
}

const MobileMeshBackground: React.FC<MobileMeshBackgroundProps> = ({ cursorForce = 7.0, fixed = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const isDarkRef = useRef(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; baseX: number; baseY: number; size: number }[] = [];
    
    // Configuration
    const gap = 30; // Grid spacing
    const baseSize = 1.5; // Dot size
    const hoverRadius = 100;

    const initParticles = () => {
      particles = [];
      const width = canvas.width;
      const height = canvas.height;
      
      // Create a grid of particles
      for (let x = 0; x < width; x += gap) {
        for (let y = 0; y < height; y += gap) {
          // Add slight offset for organic feel
          const offsetX = (Math.random() - 0.5) * 5;
          const offsetY = (Math.random() - 0.5) * 5;
          particles.push({
            x: x + offsetX,
            y: y + offsetY,
            baseX: x + offsetX,
            baseY: y + offsetY,
            size: baseSize
          });
        }
      }
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        initParticles();
      }
    };

    const draw = () => {
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = isDarkRef.current;
      const primaryColor = isDark ? '#3b82f6' : '#7e22ce';
      const secondaryColor = isDark ? '#2dd4bf' : '#ec4899';

      // Set styles based on theme
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);
      
      ctx.fillStyle = gradient;
      
      const interactingParticles: { p: typeof particles[0]; force: number }[] = [];

      // Pass 1: Update positions and batch non-interacting particles
      ctx.save();
      ctx.globalAlpha = isDark ? 0.3 : 0.4; // Base opacity for static dots
      ctx.beginPath();
      
      particles.forEach(p => {
        // Interaction
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hoverRadius) {
          const force = (hoverRadius - distance) / hoverRadius;
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          
          // Push away (mimic 3D mesh pushing down/away)
          const pushStrength = cursorForce * 2;
          p.x = p.baseX - (forceDirectionX * force * pushStrength);
          p.y = p.baseY - (forceDirectionY * force * pushStrength);
          
          interactingParticles.push({ p, force });
        } else {
          // Return to base
          if (p.x !== p.baseX) p.x -= (p.x - p.baseX) * 0.1;
          if (p.y !== p.baseY) p.y -= (p.y - p.baseY) * 0.1;
          
          // Batch drawing for static particles
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
      });
      ctx.fill();
      ctx.restore();

      // Pass 2: Draw interacting particles with Glow effect
      interactingParticles.forEach(({ p, force }) => {
        ctx.save();
        // High opacity and glow for active dots
        ctx.globalAlpha = (isDark ? 0.8 : 0.9) * force + (isDark ? 0.2 : 0.1);
        ctx.shadowBlur = 15 * force;
        ctx.shadowColor = primaryColor;
        
        const drawSize = p.size * (1 + force * 0.6); // Scale up slightly
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    // Event Listeners
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleTouchMove = (e: TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (touch) {
            mouse.current = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }
    };

    const handleMouseLeave = () => {
        mouse.current = { x: -9999, y: -9999 };
    };

    const handleThemeChange = (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          isDarkRef.current = document.documentElement.classList.contains('dark');
        }
      }
    };

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', handleMouseMove); // Listen on document for better feel
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchstart', handleTouchMove, { passive: true });
    
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Init
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchstart', handleTouchMove);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [cursorForce]);

  return (
    <div ref={containerRef} className={`${fixed ? 'fixed' : 'absolute'} inset-0 w-full h-full pointer-events-none`} style={{ zIndex: 0 }}>
      {/* Background base color transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-slate-900 transition-colors duration-500" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default MobileMeshBackground;
