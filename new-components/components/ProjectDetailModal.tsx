import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, ExternalLink, Cpu, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import { usePreferences } from '../contexts/PreferencesContext';
import { projectDetails } from '../data/projectDetails';

interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  github?: string;
  demo?: string;
  icon: React.ElementType;
}

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const { playSound } = usePreferences();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [project]);

  if (!project) return null;

  const IconComponent = project.icon;
  const details = projectDetails[project.id];
  const description = details?.longDescription || project.description;

  return createPortal(
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            layoutId={`project-card-${project.id}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700/50 rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden scrollbar-hide"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 rounded-full transition-colors text-gray-800 dark:text-white cursor-target"
            >
              <X size={20} />
            </button>

            {/* Left: Visuals */}
            <div className="w-full lg:w-2/5 relative h-64 lg:h-auto bg-gray-100 dark:bg-gray-900 overflow-hidden shrink-0">
               <ImageWithFallback
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/80 opacity-60" />
              
              {/* Floating Icon */}
              <div className="absolute top-6 left-6 z-10">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-lg">
                    <IconComponent className="text-white" size={32} />
                 </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full lg:w-3/5 p-6 md:p-10 flex flex-col bg-white dark:bg-[#0f1115] relative overflow-y-auto">
               {/* Holographic Grid Background (Subtle) */}
               <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                    style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
               </div>

               <div className="relative z-10">
                 <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                 >
                    {project.title}
                 </motion.h2>

                 <div className="flex flex-wrap gap-2 mb-8">
                    {project.tags.map((tag, i) => (
                        <span key={tag} className="px-3 py-1 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800/50">
                            {tag}
                        </span>
                    ))}
                 </div>

                 <div className="space-y-8">
                    {/* Description */}
                    <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 leading-relaxed">
                        <p>{description}</p>
                    </div>

                    {/* Features & Architecture Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Key Features */}
                        {details?.features && (
                            <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-yellow-500" /> Key Features
                                </h3>
                                <ul className="space-y-2">
                                    {details.features.map((feature, i) => (
                                        <li key={i} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                            <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tech Stack / Architecture */}
                        {details?.architecture && (
                            <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Layers className="w-5 h-5 mr-2 text-purple-500" /> Architecture
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {details.architecture.map((tech, i) => (
                                        <span key={i} className="px-3 py-1.5 text-xs font-mono bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Technical Challenges */}
                    {details?.challenges && (
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Technical Challenges
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {details.challenges}
                            </p>
                        </div>
                    )}
                 </div>

                 <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
                    {project.github && (
                        <a 
                            href={project.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center px-6 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl transition-all duration-200 font-bold group cursor-target"
                        >
                            <Github className="mr-2 group-hover:scale-110 transition-transform" size={20} />
                            View Source Code
                        </a>
                    )}
                    {project.demo && (
                        <a 
                            href={project.demo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 group cursor-target"
                        >
                            <ExternalLink className="mr-2 group-hover:scale-110 transition-transform" size={20} />
                            Launch Live Demo
                        </a>
                    )}
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ProjectDetailModal;
