import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

interface SocialLinkProps {
  icon: any;
  href: string;
  label: string;
  handle?: string;
  colorClass?: string;
  placement?: 'top' | 'bottom';
  className?: string;
  delay?: number;
}

const socialColors: Record<string, string> = {
  GitHub: '#24292e',
  LinkedIn: '#0077b5',
  Peerlist: '#00aa45',
  Twitter: '#1DA1F2',
  Instagram: '#E1306C',
  Medium: '#00ab6c',
};

const SocialLink: React.FC<SocialLinkProps> = ({ 
  icon: Icon, 
  href, 
  label, 
  handle,
  colorClass = '',
  placement = 'top',
  className = '',
  delay = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { playSound, triggerHaptic } = usePreferences();

  const handleClick = () => {
    playSound('click');
    triggerHaptic('light');
  };
  
  const color = socialColors[label] || '#3b82f6';
  const displayText = handle || label;
  const isReactIcon = label === 'Peerlist' || label === 'LinkedIn' || label === 'GitHub' || label === 'X' || label === 'Instagram' || label === 'Medium' || label === 'Dev.to';

  return (
    <motion.div 
      className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            initial={{ opacity: 0, y: placement === 'top' ? 20 : -20, scale: 0.5, rotate: placement === 'top' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: placement === 'top' ? 10 : -10, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, mass: 0.8 }}
            className={`absolute ${placement === 'top' ? '-top-14' : '-bottom-14'} z-50 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 whitespace-nowrap cursor-target active:scale-95 origin-center`}
          >
            <div 
              className="p-1.5 rounded-lg text-white shadow-lg flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <Icon size={16} {...(!isReactIcon ? { strokeWidth: 2.5 } : {})} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-wide pr-1">{displayText}</span>
            
            {/* Arrow/Triangle */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rotate-45 border-gray-200 dark:border-gray-700/50 ${
                placement === 'top' 
                  ? '-bottom-2 border-b border-r' 
                  : '-top-2 border-t border-l'
              }`}
            />
          </motion.a>
        )}
      </AnimatePresence>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`group relative p-3 bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-full border border-white/20 dark:border-white/10 shadow-sm hover:shadow-blue-500/20 transition-all duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95 cursor-target flex items-center justify-center`}
        aria-label={label}
      >
        <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300`} style={{ backgroundColor: color }} />
        <Icon 
          size={20} 
          className={`relative z-10 transition-colors duration-300 text-gray-600 dark:text-gray-400 group-hover:text-white ${colorClass}`} 
        />
      </a>
    </motion.div>
  );
};

export default SocialLink;
