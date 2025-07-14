"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Transition indicator that displays during section changes
 * @param {Object} props - Component props
 * @param {boolean} props.isTransitioning - Whether a transition is currently happening
 * @param {string} props.transitioningTo - The section being transitioned to
 * @returns {JSX.Element} TransitionIndicator component
 */
export function TransitionIndicator({ isTransitioning, transitioningTo }) {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setShowIndicator(true);
      // Hide indicator after transition completes
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  if (!showIndicator) return null;

  return (
    <motion.div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: isTransitioning ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div
        className="text-2xl md:text-3xl font-extralight tracking-widest text-white/60 mix-blend-difference"
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{
          opacity: isTransitioning ? 1 : 0,
          y: isTransitioning ? 0 : 20,
          filter: isTransitioning ? "blur(0px)" : "blur(8px)",
        }}
        exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
        transition={{ duration: 0.5 }}></motion.div>
    </motion.div>
  );
}

/**
 * Custom blur effect overlay that enhances section transitions
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether the blur effect is active
 * @returns {JSX.Element} BlurEffect component
 */
export function BlurEffect({ isActive }) {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40 bg-neutral-950/0 backdrop-blur-none"
      animate={{
        backdropFilter: isActive ? "blur(8px)" : "blur(0px)",
        backgroundColor: isActive ? "rgba(10, 10, 10, 0.3)" : "rgba(10, 10, 10, 0)",
      }}
      transition={{ duration: 0.4 }}
    />
  );
}
