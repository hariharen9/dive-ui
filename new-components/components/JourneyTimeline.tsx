import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

interface Milestone {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  delay?: string;
}

interface JourneyTimelineProps {
  milestones: Milestone[];
}

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ milestones }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, triggerHaptic } = usePreferences();

  // Scroll progress for the entire container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="relative max-w-4xl mx-auto py-12">
      
      {/* Central Neural Line (Background) */}
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-800 -translate-x-1/2 rounded-full" />
      
      {/* Animated Fill Line */}
      <motion.div 
        className="absolute left-8 md:left-1/2 top-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500 -translate-x-1/2 rounded-full origin-top"
        style={{ height: '100%', scaleY }}
      />

      <div className="space-y-24">
        {milestones.map((milestone, index) => {
          const isEven = index % 2 === 0;
          return (
            <TimelineNode 
              key={index} 
              milestone={milestone} 
              index={index} 
              isEven={isEven}
              playSound={playSound}
              triggerHaptic={triggerHaptic}
            />
          );
        })}
      </div>
    </div>
  );
};

const TimelineNode: React.FC<{ 
  milestone: Milestone; 
  index: number; 
  isEven: boolean;
  playSound: any;
  triggerHaptic: any;
}> = ({ milestone, index, isEven, playSound, triggerHaptic }) => {
  const nodeRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: nodeRef,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.5, 1]);
  const x = useTransform(
    scrollYProgress, 
    [0, 0.5], 
    [isEven ? 50 : -50, 0] // Slide in from sides
  );

  const Icon = milestone.icon;

  return (
    <div 
        ref={nodeRef}
        className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      {/* Node Point */}
      <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
        <motion.div 
            style={{ scale, opacity }}
            className={`w-16 h-16 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br ${milestone.color} flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.2)]`}
        >
          <Icon className="text-white w-7 h-7" />
        </motion.div>
      </div>

      {/* Connection Line (Mobile Only - Horizontal stub) */}
      <div className="absolute left-8 md:hidden w-12 h-1 bg-gray-200 dark:bg-gray-800" />

      {/* Content Card */}
      <motion.div 
        style={{ opacity, x }}
        className={`ml-24 md:ml-0 w-full md:w-[calc(50%-50px)]`}
        onViewportEnter={() => {
            // Optional: Play subtle sound when node appears
            // playSound('discovery'); // Might be too noisy if triggers on every scroll
        }}
      >
        <div 
          className="group relative p-6 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default overflow-hidden"
          onMouseEnter={() => {
              playSound('click');
              triggerHaptic('light');
          }}
        >
          {/* Hover Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${milestone.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
            {milestone.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
            {milestone.description}
          </p>

          {/* Decorative Corner */}
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${milestone.color} opacity-10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500`} />
        </div>
      </motion.div>
    </div>
  );
};

export default JourneyTimeline;
