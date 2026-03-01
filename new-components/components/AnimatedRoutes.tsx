import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Import pages
import Home from '../pages/Home';
import About from '../pages/About';
import Resume from '../pages/Resume';
import Projects from '../pages/Projects';
import NotFound from '../pages/NotFound';
import Blog from '../pages/Blog';
import Contact from '../pages/Contact';
import Privacy from '../pages/Privacy';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.99
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for a "premium" feel
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.01,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="w-full" // Ensure full width for layout consistency
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Home />
          </PageTransition>
        } />
        <Route path="/about" element={
          <PageTransition>
            <About />
          </PageTransition>
        } />
        <Route path="/resume" element={
          <PageTransition>
            <Resume />
          </PageTransition>
        } />
        <Route path="/projects" element={
          <PageTransition>
            <Projects />
          </PageTransition>
        } />
        <Route path="/blog" element={
          <PageTransition>
            <Blog />
          </PageTransition>
        } />
        <Route path="/contact" element={
          <PageTransition>
            <Contact />
          </PageTransition>
        } />
        <Route path="/privacy" element={
          <PageTransition>
            <Privacy />
          </PageTransition>
        } />
        <Route path="*" element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
