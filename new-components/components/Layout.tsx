import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, FileText, Briefcase, Rss, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socialLinks } from '../data/socials';

const namelogoDark = '/namelogowhite.svg';
const namelogoLight = '/namelogo.svg';

import CurvedLoop from './CurvedLoop';
import GradientText from './GradientText';
import MobileLayoutIndicator from './MobileLayoutIndicator';
import SocialLink from './SocialLink';
import LiveStatus from './LiveStatus';
import { usePreferences } from '../contexts/PreferencesContext';
import { AnimatedThemeToggler } from './AnimatedThemeToggler';
import { AnimatedHamburgerIcon } from './AnimatedHamburgerIcon';
import AnimatedMeshBackground from './AnimatedMeshBackground';

import { programmingQuotes } from '../data/quotes';

interface LayoutProps {
  children: React.ReactNode;
}

interface Quote {
  text: string;
  author: string | null;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [quote, setQuote] = useState<Quote | null>(null);
  const location = useLocation();
  const { playSound, triggerHaptic } = usePreferences();

  const handleClick = () => {
    playSound('click');
    triggerHaptic('light');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    const observer = new MutationObserver(() => {
      setTheme(localStorage.getItem('theme') || 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

useEffect(() => {
    // Disable body scroll and toggle class when mobile menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('mobile-menu-open');
    }
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const randomQuote = programmingQuotes[Math.floor(Math.random() * programmingQuotes.length)];
    setQuote(randomQuote);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: User },
    { path: '/resume', label: 'Resume', icon: FileText },
    { path: '/projects', label: 'Projects', icon: Briefcase },
    { path: '/blog', label: 'Blog', icon: Rss },
    { path: '/contact', label: 'Contact', icon: Mail }
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
      <AnimatedMeshBackground fixed={true} cursorForce={7.0} />
      {location.pathname === '/' && (
        <div className="absolute top-0 left-0 right-0 h-[120vh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 -z-10"></div>
      )}
      <header className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[99] transition-all duration-500 w-[95%] sm:w-auto ${
        isScrolled 
          ? 'backdrop-blur-md bg-white/30 dark:bg-gray-900/30 shadow-2xl' 
          : 'backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 shadow-xl'
      } rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/30`}>
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link 
              to="/"  
              className="cursor-target transition-all duration-300 transform hover:scale-105 flex-shrink-0 md:mr-8"
              onClick={handleClick}
            >
              <img src={theme === 'dark' ? namelogoDark : namelogoLight} alt="HariHaren Logo" className="h-9" />
            </Link>

            <div className="items-center hidden space-x-2 md:flex relative">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`cursor-target relative px-6 py-3 text-sm font-display font-medium transition-colors duration-500 rounded-2xl ${
                    isActive
                      ? 'text-white'
                      : 'text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                  onClick={handleClick}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-pill"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 shadow-lg rounded-2xl -z-10"
                      transition={{ 
                        type: "spring", 
                        stiffness: 160, 
                        damping: 18,
                        mass: 1.2
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                                </Link>
                              )})} 
                            </div>
                            <AnimatedThemeToggler
                              className="hidden md:block cursor-target p-3 text-gray-600 transition-all duration-300 transform rounded-2xl dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 hover:scale-110"
                              aria-label="Toggle dark mode"
                            />
                
            <div className="flex items-center space-x-2 md:hidden">
              <AnimatedThemeToggler
                className="cursor-target p-2 text-gray-600 transition-all duration-300 rounded-lg dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60"
                aria-label="Toggle dark mode"
              />
              <AnimatedHamburgerIcon
                isOpen={isMenuOpen}
                onClick={() => {
                  handleClick();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="cursor-target text-gray-600 dark:text-gray-400 p-2 rounded-lg"
              />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full z-[60] md:hidden"
            >
              <div className="flex flex-col bg-white/40 dark:bg-gray-900/50 backdrop-blur-3xl border-t border-white/50 dark:border-white/10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] rounded-t-[2.5rem] max-h-[85vh]">
                {/* Drag Handle Indicator */}
                <div className="w-full flex justify-center pt-4 pb-2" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full backdrop-blur-md"></div>
                </div>

                <div className="flex-grow px-6 pb-2 space-y-2 overflow-y-auto">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-4 px-6 py-4 text-base font-display font-medium rounded-2xl transition-all duration-300 ${
                          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        } ${
                          location.pathname === link.path
                            ? 'text-white bg-blue-600/90 dark:bg-blue-500/90 shadow-lg'
                            : 'text-black dark:text-white hover:bg-white/70 dark:hover:bg-gray-800/70'
                        }`}
                        style={{ transitionDelay: `${100 + index * 50}ms` }}
                        onClick={() => {
                          handleClick();
                          setIsMenuOpen(false);
                        }}
                      >
                        <Icon size={20} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="px-6 pt-4 pb-16 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <span 
                      className="mb-2 text-sm font-semibold uppercase inline-block animate-gradient"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #ffaa40, #9c40ff, #3b82f6, #06b6d4, #ffaa40)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        backgroundSize: '300% 100%',
                      }}
                    >
                      Food for Thought
                    </span>
                    {quote ? (
                      <figure>
                        <blockquote className="text-xs italic text-gray-500 dark:text-gray-400">
                          "{quote.text}"
                        </blockquote>
                        {quote.author && (
                          <figcaption className="mt-1 text-xs text-right text-gray-600 dark:text-gray-500">
                            - {quote.author}
                          </figcaption>
                        )}
                      </figure>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fetching a quote...</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        {children}
      </main>

      <MobileLayoutIndicator />

      <footer className="transition-colors duration-300 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 relative z-50">
        <div className="px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-8 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <GradientText>
                Developed with <span className="text-red-500 animate-pulse">❤️</span> by HariHaren
              </GradientText>
              <div className="mt-1 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-500">
                <p>© 2026 All rights reserved</p>
                <span>•</span>
                <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              </div>
            </div>
            
            <div className="flex justify-center">
              <LiveStatus />
            </div>
            
            <div className="flex flex-col items-center">
              <GradientText className="mb-4 text-sm font-semibold text-gray-600 uppercase dark:text-gray-400">Connect with me</GradientText>
              <div className="flex flex-wrap justify-center gap-4 max-w-[280px] sm:max-w-none mx-auto">
                {socialLinks.map((social, index) => (
                  <SocialLink
                    key={social.label}
                    icon={social.icon}
                    href={social.href}
                    label={social.label}
                    handle={social.handle}
                    colorClass={social.hoverColor}
                    placement="top"
                    delay={index}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
        <CurvedLoop 
          marqueeText="Be ✦ Creative ✦ With ✦ HARIHAREN ✦ "
          speed={2.5}
          curveAmount={450}
          direction="right"
          interactive={true}
          className="custom-text-style"
        />
      </footer>

      {/* Gooey Filter for Liquid Navigation */}
      <svg style={{ visibility: 'hidden', position: 'absolute' }} width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Layout;