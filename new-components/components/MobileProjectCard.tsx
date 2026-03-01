import React, { useState } from 'react';
import { ExternalLink, Github } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import MobileCardModal from './MobileCardModal';
import ImageWithFallback from './ImageWithFallback';

interface MobileProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    image: string;
    tags: string[];
    github?: string;
    demo?: string;
    icon: React.ElementType;
  };
}

const MobileProjectCard: React.FC<MobileProjectCardProps> = ({ project }) => {
  const IconComponent = project.icon;
  const { playSound, triggerHaptic } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playSound('click');
    triggerHaptic('light');
    e.stopPropagation();
  };

  const handleOpenModal = () => {
    playSound('click');
    triggerHaptic('light');
    setIsModalOpen(true);
  };

  const links = [];
  if (project.demo) {
    links.push({
      label: 'Live Demo',
      url: project.demo,
      icon: ExternalLink,
      type: 'demo' as const
    });
  }
  if (project.github) {
    links.push({
      label: 'View Code',
      url: project.github,
      icon: Github,
      type: 'github' as const
    });
  }

  return (
    <>
      <div 
        onClick={handleOpenModal}
        className="relative group animate-fade-in-up mobile-float mobile-touch-feedback mobile-ripple mobile-focus-visible cursor-pointer"
      >
        {/* Background Card - Creates depth with slight offset */}
        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl blur-sm opacity-60 group-hover:opacity-80 transition-all duration-300"></div>
        
        {/* Middle Layer - Adds more depth */}
        <div className="absolute inset-0 translate-x-1 translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-800/20 dark:to-indigo-800/20 rounded-2xl opacity-70 group-hover:opacity-90 transition-all duration-300"></div>
        
        {/* Main Card */}
        <div className="relative bg-white/95 dark:bg-gray-800/95 mobile-backdrop-blur border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1 group-hover:scale-[1.02] mobile-card-enhanced mobile-interaction-glow">
          
          {/* Image Container - Compact for mobile */}
          <div className="relative h-32 overflow-hidden">
            <ImageWithFallback
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            
            {/* Floating Icon */}
            <div className="absolute top-2 left-2">
              <div className="p-1.5 rounded-lg bg-white/25 backdrop-blur-md border border-white/20 group-hover:bg-white/35 transition-all duration-300">
                <IconComponent className="text-white drop-shadow-sm" size={14} />
              </div>
            </div>
            
            {/* Action Buttons Overlay - Mobile Optimized */}
            <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-target p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-all duration-200"
                  onClick={handleClick}
                >
                  <Github className="text-white" size={12} />
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-target p-1.5 bg-blue-600/80 backdrop-blur-sm rounded-lg hover:bg-blue-600 transition-all duration-200"
                  onClick={handleClick}
                >
                  <ExternalLink className="text-white" size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Content - Condensed for mobile */}
          <div className="p-3">
            {/* Title - Truncated for mobile */}
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {project.title}
            </h3>
            
            {/* Description - Limited lines for mobile */}
            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-3 line-clamp-2">
              {project.description}
            </p>

            {/* Tags - Show only first 2 for mobile */}
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/40 rounded-full border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 2 && (
                <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/40 rounded-full border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  +{project.tags.length - 2}
                </span>
              )}
            </div>

            {/* Bottom Actions - Mobile optimized */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-target flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                    onClick={handleClick}
                  >
                    <Github className="mr-1" size={12} />
                    Code
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-target flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                    onClick={handleClick}
                  >
                    <ExternalLink className="mr-1" size={12} />
                    Demo
                  </a>
                )}
              </div>
              
              {/* Interaction Indicator */}
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300"></div>
            </div>
          </div>
          
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-blue-400/5 group-hover:via-purple-400/5 group-hover:to-pink-400/5 rounded-2xl transition-all duration-500 pointer-events-none"></div>
        </div>
        
        {/* Floating Elements for Extra Visual Interest */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse transition-all duration-300"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-green-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-bounce transition-all duration-300 delay-100"></div>
      </div>

      <MobileCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={{
          title: project.title,
          description: project.description,
          image: project.image,
          tags: project.tags,
          icon: project.icon,
          links: links
        }}
      />
    </>
  );
};

export default MobileProjectCard;