import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Youtube, Play, Bell, ThumbsUp, Gamepad2, MessageCircle, Share2, ExternalLink, Zap } from 'lucide-react';
import GradientText from './GradientText';
import { usePreferences } from '../contexts/PreferencesContext';
import ImageWithFallback from './ImageWithFallback';

const YoutubeSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, triggerHaptic } = usePreferences();
  
  // Parallax effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Mouse interaction for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const cardRotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const cardRotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const cardBg = useMotionTemplate`radial-gradient(circle at ${mouseX.get() * 100 + 50}% ${mouseY.get() * 100 + 50}%, rgba(255,0,0,0.15), transparent 80%)`;

  const handleClick = () => {
    playSound('click');
    triggerHaptic('heavy');
    window.open('https://www.youtube.com/@thisisbadpanda', '_blank');
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-24 perspective-1000 overflow-visible"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent blur-3xl" />
      
      {/* Floating Icons Background */}
      <FloatingIcon icon={Play} delay={0} x="10%" y="20%" />
      <FloatingIcon icon={Youtube} delay={2} x="85%" y="15%" />
      <FloatingIcon icon={Gamepad2} delay={1} x="15%" y="70%" />
      <FloatingIcon icon={Bell} delay={3} x="80%" y="60%" />

      <motion.div 
        style={{ y, opacity, scale }}
        className="max-w-5xl mx-auto px-4 relative z-10"
      >
        <div className="text-center mb-12">
           <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6 backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Content Creation</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
                The Bad Panda
              </span> Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Epic gaming moments, immersive playthroughs, and tech adventures. Join my squad on YouTube!
            </p>
        </div>

        {/* 3D Interactive Card */}
        <motion.div
          style={{ rotateX: cardRotateX, rotateY: cardRotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
          onClick={handleClick}
          className="relative group cursor-pointer"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
            {/* Dynamic Background */}
            <motion.div style={{ background: cardBg }} className="absolute inset-0 pointer-events-none" />

            {/* Content Layout */}
            <div className="grid md:grid-cols-5 gap-0">
              
              {/* Left: Video Preview Area */}
              <div className="md:col-span-3 relative h-64 md:h-auto min-h-[300px] overflow-hidden bg-black group-hover:saturate-150 transition-all duration-500">
                {/* Simulated Static/Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                
                {/* Thumbnail Image (Placeholder or Actual) */}
                <ImageWithFallback 
                  src="https://miro.medium.com/v2/resize:fit:1250/format:webp/1*gKK4xuXMTwXeDntW_LSHkA.png" 
                  alt="Latest Video" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-80" 
                />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.6)] group-hover:scale-110 transition-transform duration-300 z-10">
                    <Play fill="white" className="text-white ml-2" size={32} />
                  </div>
                  {/* Pulse Rings */}
                  <div className="absolute w-20 h-20 bg-red-600 rounded-full animate-ping opacity-75"></div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md uppercase tracking-wider mb-2 inline-block">Latest Tech Upload</span>
                  <h3 className="text-white font-bold text-xl md:text-2xl line-clamp-2 drop-shadow-lg">
                    LocalSeek: Privacy-First AI Chat for VS Code
                  </h3>
                </div>
              </div>

              {/* Right: Channel Stats & Info */}
              <div className="md:col-span-2 p-8 flex flex-col justify-between bg-gray-50 dark:bg-[#1a1a1a] relative">
                {/* Channel Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black p-[2px] ring-2 ring-red-500/50">
                      <ImageWithFallback 
                        src="/me3.webp" 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Bad Panda</h4>
                      <p className="text-xs text-gray-500">@thisisbadpanda</p>
                    </div>
                  </div>
                  <Youtube className="text-red-600" size={24} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="p-4 bg-white dark:bg-black/40 rounded-xl border border-gray-200 dark:border-gray-800 text-center group/stat hover:border-red-500/50 transition-colors">
                    <p className="text-2xl font-black text-gray-900 dark:text-white group-hover/stat:text-red-500 transition-colors">500+</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Subscribers</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-black/40 rounded-xl border border-gray-200 dark:border-gray-800 text-center group/stat hover:border-red-500/50 transition-colors">
                    <p className="text-2xl font-black text-gray-900 dark:text-white group-hover/stat:text-red-500 transition-colors">50+</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Videos</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all transform group-hover:scale-105 shadow-lg shadow-red-600/20">
                    <Bell size={18} />
                    <span>SUBSCRIBE</span>
                  </button>
                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-sm flex items-center justify-center space-x-1 transition-colors">
                      <ThumbsUp size={14} /> <span>Like</span>
                    </button>
                    <button className="flex-1 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-sm flex items-center justify-center space-x-1 transition-colors">
                      <Share2 size={14} /> <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

const FloatingIcon: React.FC<{ icon: any, delay: number, x: string, y: string }> = ({ icon: Icon, delay, x, y }) => (
  <motion.div
    className="absolute text-gray-200 dark:text-gray-800 pointer-events-none z-0"
    style={{ left: x, top: y }}
    animate={{ 
      y: [0, -20, 0], 
      rotate: [0, 10, -10, 0],
      opacity: [0.3, 0.6, 0.3] 
    }}
    transition={{ 
      duration: 5, 
      delay, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
  >
    <Icon size={48} />
  </motion.div>
);

export default YoutubeSection;
