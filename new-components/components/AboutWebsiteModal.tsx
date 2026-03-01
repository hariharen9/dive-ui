import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Code, Cpu, Layers, Palette, Terminal, Zap, Smartphone, Search } from 'lucide-react';
import GradientText from './GradientText';

interface AboutWebsiteModalProps {
  onClose: () => void;
}

const AboutWebsiteModal: React.FC<AboutWebsiteModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const features = [
    {
      icon: Terminal,
      title: "Interactive Terminal OS",
      description: "A fully functional simulated file system. Features command piping (`ls | grep`), real-time weather data (`weather`), and hidden Easter eggs like a Matrix rain effect and a `snake` game."
    },
    {
      icon: Cpu,
      title: "Smart Performance Core",
      description: "Engineered for speed. Uses route-based code splitting, intelligent prefetching on hover, and conditional rendering to swap heavy 3D assets for lightweight Canvas alternatives on mobile devices."
    },
    {
      icon: Smartphone,
      title: "Adaptive 3D Engine",
      description: "Smart rendering strategy that swaps heavy WebGL shaders for a lightweight Canvas 2D particle engine on mobile. The background adapts to system themes, switching between additive glowing blends (Dark) and soft shadow mapping (Light)."
    },
    {
      icon: Search,
      title: "Client-Side Intelligence",
      description: "Features regex-based form validation, spam protection, and instant route prefetching on hover. The site anticipates user intent to load resources before they click."
    },
    {
      icon: Palette,
      title: "Micro-Interactions",
      description: "Every interaction is tactile. Features a GSAP-powered magnetic cursor with parallax corners, spatial audio feedback using the Web Audio API, and haptic vibration patterns for supported devices."
    },
    {
      icon: Zap,
      title: "System Simulation",
      description: "Goes beyond UI. Try running `sudo rm -rf /` for a realistic BSOD crash simulation, or `hack` for a cinematic sequence. The terminal history persists state just like a real shell."
    },
    {
      icon: Layers,
      title: "Custom Architecture",
      description: "This isn't a template. It's a custom-engineered React application with a bespoke file system, state management, and architectural patterns designed to scale."
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden flex flex-col animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-full uppercase">
                Behind the Code
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Under the <GradientText className="inline-block">Hood</GradientText>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/20">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-500/20 text-center">
            <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              "This portfolio is my personal playground for testing new ideas. It's been a journey of continuous iteration, tweaking pixels and optimizing code to see just how performant and interactive a modern web app can be. Being Built for over a year with numerous minor but meaningful enhancements, website wide."
            </p>
            <div className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              - HariHaren
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AboutWebsiteModal;