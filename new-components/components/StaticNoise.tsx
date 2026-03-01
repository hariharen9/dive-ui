import React, { useEffect, useRef } from 'react';

interface StaticNoiseProps {
  clarity: number; // 0 (full noise) to 1 (clear)
}

const StaticNoise: React.FC<StaticNoiseProps> = ({ clarity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      frame++;
      // Only draw every other frame for performance/retro feel
      if (frame % 2 === 0) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear logic: simpler than clearing rect
        // We only draw noise where needed
        ctx.clearRect(0, 0, w, h);

        if (clarity < 1) {
            const imageData = ctx.createImageData(w, h);
            const data = imageData.data;
            const buffer32 = new Uint32Array(data.buffer);
            
            // The higher the clarity, the fewer noise pixels we draw (or lower alpha)
            // Strategy: Draw full noise but modify alpha based on clarity? 
            // Better: Random threshold.
            
            const noiseDensity = 1 - clarity; // 1 = full noise, 0 = no noise
            
            for (let i = 0; i < buffer32.length; i++) {
                if (Math.random() < noiseDensity) {
                    // Gray pixel with random alpha
                    const gray = Math.random() * 255;
                    // ABGR format (little endian)
                    buffer32[i] = (255 << 24) | (gray << 16) | (gray << 8) | gray;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [clarity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay opacity-50"
    />
  );
};

export default StaticNoise;