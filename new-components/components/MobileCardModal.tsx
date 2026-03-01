import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Github, BookOpen } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import ImageWithFallback from './ImageWithFallback';

interface LinkData {
  label: string;
  url: string;
  icon: React.ElementType;
  type: 'github' | 'demo' | 'blog';
}

interface MobileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    description: string;
    image: string;
    tags: string[];
    icon: React.ElementType;
    links: LinkData[];
  };
}

const MobileCardModal: React.FC<MobileCardModalProps> = ({ isOpen, onClose, data }) => {
  const { playSound, triggerHaptic } = usePreferences();
  const IconComponent = data.icon;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Full Screen Modal Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full h-full bg-white dark:bg-gray-950 flex flex-col overflow-hidden"
          >
            {/* Header / Image Area */}
            <div className="relative h-[40vh] shrink-0">
              <ImageWithFallback 
                src={data.image} 
                alt={data.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
              
              {/* Top Bar Actions */}
              <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-10">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <IconComponent className="text-white" size={24} />
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="absolute bottom-8 left-6 right-6">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white leading-tight drop-shadow-lg"
                >
                  {data.title}
                </motion.h2>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide">
              {/* Tags Area */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-2.5"
              >
                {data.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-4 py-1.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">About</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-medium">
                  {data.description}
                </p>
              </motion.div>

              {/* Action Buttons - Fixed to bottom or scrollable? Let's keep them here but styled better */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid gap-4 pt-4 pb-12"
              >
                {data.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                        playSound('click');
                        triggerHaptic('heavy');
                    }}
                    className={`flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-black text-base transition-all active:scale-[0.97] ${
                      link.type === 'github'
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                        : 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                    }`}
                  >
                    <link.icon size={22} />
                    {link.label}
                    <ExternalLink size={16} className="opacity-50 ml-1" />
                  </a>
                ))}
              </motion.div>
            </div>
            
            {/* Visual Indicator for Swipe-to-close (hint) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-800 rounded-full opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default MobileCardModal;
