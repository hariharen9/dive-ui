import React, { useState, useEffect, useRef } from 'react';

interface SystemBootProps {
  onComplete: () => void;
}

const SystemBoot: React.FC<SystemBootProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to add lines with a delay
  const addLine = (text: string, delay: number, style: 'normal' | 'warning' | 'error' | 'success' | 'highlight' = 'normal') => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setLines((prev) => [...prev, JSON.stringify({ text, style })]);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        resolve();
      }, delay);
    });
  };

  useEffect(() => {
    const bootSequence = async () => {
        // Detect User Agent for "Personalization"
        const userAgent = navigator.userAgent;
        const isMac = userAgent.indexOf("Mac") !== -1;
        const platform = isMac ? "MACOS_KERNEL" : "WINDOWS_NT_KERNEL";

      // Phase 1: Hardware Init
      await addLine("INITIALIZING NEURAL LINK v4.5.2...", 100, 'highlight');
      await addLine("----------------------------------------", 50);
      await addLine(`DETECTED HOST: ${platform}`, 150);
      await addLine("CPU: QUANTUM CORE i9-9900K @ 5.0GHz... [OK]", 100, 'success');
      await addLine("GPU: NVIDIA RTX 4090 [OK]", 100, 'success');
      await addLine("RAM: 128GB DDR6 [OK]", 100, 'success');
      await addLine("BIOMETRICS: BYPASSED", 200, 'warning');
      await addLine("", 50);

      // Phase 2: Security & Network
      await addLine("ESTABLISHING SECURE CONNECTION...", 150);
      await addLine("> Pinging satellite relay... 12ms", 100);
      await addLine("> Decrypting asset bundles... [DONE]", 150);
      await addLine("> Bypassing corporate firewalls... [SUCCESS]", 200, 'warning');
      await addLine("", 100);

      // Phase 3: Loading Portfolio Modules
      await addLine("LOADING PORTFOLIO MODULES:", 100, 'highlight');
      await addLine("[*] React Core Engine", 100);
      await addLine("[*] Tailwind CSS Style Matrix", 80);
      await addLine("[*] Three.js Physics Engine", 80);
      await addLine("[*] Project Holograms", 150);
      
      setShowProgress(true);

      // Simulate Progress Bar
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15; // Varied speed
        });
      }, 50);

      // Wait for progress to finish
      await new Promise<void>(resolve => setTimeout(resolve, 1200));
      setShowProgress(false);

      await addLine("", 50);
      await addLine("ALL SYSTEMS NOMINAL.", 100, 'success');
      await addLine("WELCOME, GUEST USER.", 300, 'highlight');
      await addLine("INITIATING VISUAL INTERFACE...", 500);

      // Exit
      setIsExiting(true);
      setTimeout(onComplete, 800); 
    };

    bootSequence();
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] overflow-hidden bg-black font-mono cursor-none flex items-center justify-center ${isExiting ? 'animate-turn-off' : ''}`}>
      
      {/* Background Matrix/Grid Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff41_1px,transparent_1px),linear-gradient(to_bottom,#00ff41_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:perspective(500px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] animate-[grid-move_20s_linear_infinite]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
      </div>

      {/* CRT Scanline & Vignette */}
      <div className="pointer-events-none fixed inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
      <div className="pointer-events-none fixed inset-0 z-20 bg-radial-gradient from-transparent to-black opacity-80"></div>

      {/* Main Terminal Window */}
      <div className="relative z-30 w-[800px] max-w-[95vw] h-[600px] max-h-[85vh] bg-black/90 border border-green-500/30 rounded-lg shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col overflow-hidden backdrop-blur-md animate-boot-window">
        
        {/* Header Bar */}
        <div className="h-10 bg-green-900/10 border-b border-green-500/20 flex items-center px-4 justify-between select-none">
          <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500/50"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/50"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/50"></span>
          </div>
          <span className="text-green-500/60 text-xs font-bold tracking-[0.2em]">HARIHAREN // SYSTEM_ROOT</span>
          <span className="text-green-500/60 text-xs">v2.0.4</span>
        </div>

        {/* Content Area */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto scrollbar-hide font-mono text-sm md:text-base leading-relaxed"
        >
          {lines.map((lineStr, index) => {
            const { text, style } = JSON.parse(lineStr);
            let className = "text-green-400 opacity-80";
            if (style === 'warning') className = "text-yellow-400 font-bold";
            if (style === 'error') className = "text-red-500 font-bold";
            if (style === 'success') className = "text-green-300 font-bold";
            if (style === 'highlight') className = "text-cyan-400 font-bold text-lg mt-2 mb-1";

            return (
                <div key={index} className={`mb-1 drop-shadow-[0_0_5px_rgba(0,255,65,0.5)] ${className}`}>
                    {text}
                </div>
            );
          })}

          {showProgress && (
            <div className="mt-4 mb-2">
                <div className="flex justify-between text-green-500 text-xs mb-1">
                    <span>LOADING_ASSETS</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-green-900/30 border border-green-500/30 rounded-sm p-[1px]">
                    <div 
                        className="h-full bg-green-500 shadow-[0_0_10px_rgba(0,255,65,0.8)] transition-all duration-75 ease-out relative overflow-hidden" 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                    >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                </div>
            </div>
          )}

          {!isExiting && (
            <div className="mt-2 animate-pulse text-green-500">
              <span className="mr-2">_</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemBoot;