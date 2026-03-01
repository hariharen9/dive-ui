import React, { useState, useEffect } from 'react';
import { motion, useSpring, useScroll } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Section {
  id: string;
  label: string;
}

interface NeuralSpineProps {
    containerRef?: React.RefObject<HTMLElement>;
    sections: Section[];
}

const NeuralSpine: React.FC<NeuralSpineProps> = ({ containerRef, sections }) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [isHovered, setIsHovered] = useState(false);
  
  const { scrollYProgress } = useScroll({ 
      container: containerRef,
      layoutEffect: false 
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      let scrollPosition = 0;
      
      if (containerRef?.current) {
         const container = containerRef.current;
         scrollPosition = container.scrollTop + container.clientHeight / 2;
      } else {
         scrollPosition = window.scrollY + window.innerHeight / 2;
      }
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
          }
        }
      }
    };

    if (containerRef?.current) {
        const container = containerRef.current;
        container.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    } else {
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef, sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        if (containerRef?.current) {
            // Container scroll
             element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Window scroll
            const offsetTop = element.offsetTop;
            // Add a small offset for fixed headers if needed, usually ~80px
            window.scrollTo({
                top: offsetTop - 100, 
                behavior: 'smooth'
            });
        }
    }
  };

  const scrollToTop = () => {
    if (containerRef?.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef?.current) {
        containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
    >
      {/* Scroll to Top - Aligned with spine */}
      <div className="w-10 flex justify-center">
        <button 
            onClick={scrollToTop}
            className="flex items-center justify-center p-2 text-gray-500 hover:text-blue-400 transition-all duration-300 hover:-translate-y-1 cursor-target"
            aria-label="Scroll to top"
        >
            <ChevronUp size={20} className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-50'}`} />
        </button>
      </div>

      {sections.map((section) => {
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group relative flex items-center justify-end focus:outline-none cursor-target py-1"
            aria-label={`Scroll to ${section.label}`}
          >
            {/* Label - Only visible on hover */}
            <div className={`absolute right-12 transition-all duration-300 pointer-events-none ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-md backdrop-blur-md border transition-colors whitespace-nowrap
                    ${isActive 
                        ? 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-100/50 dark:bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'text-gray-600 dark:text-gray-500 border-gray-200 dark:border-white/5 bg-white/60 dark:bg-black/40 group-hover:text-gray-900 dark:group-hover:text-white group-hover:border-gray-300 dark:group-hover:border-white/20'}`}>
                    {section.label}
                </span>
            </div>

            {/* Pill Node - Centered in fixed width container */}
            <div className="w-10 flex items-center justify-center">
                <motion.div
                    className={`rounded-full transition-all duration-300 backdrop-blur-md border
                        ${isActive 
                            ? 'bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                            : 'bg-black/10 dark:bg-white/10 border-black/5 dark:border-white/10 hover:bg-black/20 dark:hover:bg-white/20 hover:border-black/10 dark:hover:border-white/30'}`}
                    animate={{
                        width: isActive ? 6 : 4,
                        height: isActive ? 24 : (isHovered ? 12 : 8),
                        opacity: isActive ? 1 : 0.5
                    }}
                />
            </div>
          </button>
        );
      })}

      {/* Scroll to Bottom - Aligned with spine */}
      <div className="w-10 flex justify-center">
        <button 
            onClick={scrollToBottom}
            className="flex items-center justify-center p-2 text-gray-500 hover:text-blue-400 transition-all duration-300 hover:translate-y-1 cursor-target"
            aria-label="Scroll to bottom"
        >
            <ChevronDown size={20} className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-50'}`} />
        </button>
      </div>
    </motion.div>
  );
};

export default NeuralSpine;