import React from 'react';
import { ExternalLink, Github } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import ImageWithFallback from './ImageWithFallback';

interface ProjectCardProps {
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
  onSelect?: (project: any) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const IconComponent = project.icon;
  const { playSound, triggerHaptic } = usePreferences();

  const handleClick = (e: React.MouseEvent) => {
    // If clicking a link/button inside, don't trigger selection
    // (Though we stop propagation on links, this is a fallback)
    playSound('click');
    triggerHaptic('light');
    if (onSelect) {
        onSelect(project);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    playSound('click');
    triggerHaptic('light');
  };

  return (
    <div
      key={project.id}
      onClick={handleClick}
      className="relative overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-lg group dark:bg-gray-800 rounded-2xl hover:shadow-2xl dark:border-slate-700 animate-fade-in-up cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <ImageWithFallback
          src={project.image}
          alt={project.title}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
        <div className="absolute top-4 left-4">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <IconComponent className="text-white" size={20} />
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
          {project.title}
        </h3>
        <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm font-medium text-blue-700 rounded-full bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 font-mono"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 4 && (
             <span className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">+{project.tags.length - 4}</span>
          )}
        </div>

        <div className="flex space-x-4">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-target flex items-center px-4 py-2 text-gray-700 transition-colors dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10 relative hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={handleLinkClick}
            >
              <Github className="mr-2" size={16} />
              Code
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-target flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 z-10 relative shadow-md hover:shadow-lg"
              onClick={handleLinkClick}
            >
              <ExternalLink className="mr-2" size={16} />
              Demo
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
