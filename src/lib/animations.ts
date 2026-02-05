// Spring Animation Configuration - Remotion-inspired physics
// Professional, subtle animations with real spring physics

import { Variants, Transition } from "framer-motion";

// ==========================================
// SPRING CONFIGURATIONS (Remotion-inspired)
// ==========================================

// Subtle, professional spring - perfect for medical apps
export const springSubtle: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Responsive spring - quick feedback
export const springResponsive: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

// Gentle spring - for larger elements
export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 28,
  mass: 1.2,
};

// Bouncy spring - for playful interactions (use sparingly)
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 15,
  mass: 0.5,
};

// ==========================================
// PAGE TRANSITION VARIANTS
// ==========================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springSubtle,
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// ==========================================
// CONTAINER VARIANTS (for staggered children)
// ==========================================

export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ==========================================
// ITEM VARIANTS (for list items, cards, etc.)
// ==========================================

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSubtle,
  },
};

export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSubtle,
  },
};

export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSubtle,
  },
};

export const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSubtle,
  },
};

// ==========================================
// TABLE ROW VARIANTS
// ==========================================

export const tableRowVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      ...springResponsive,
    },
  },
};

// ==========================================
// CARD VARIANTS
// ==========================================

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSubtle,
  },
};

export const statCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springGentle,
  },
};

// ==========================================
// HOVER EFFECTS
// ==========================================

export const hoverScaleEffect = {
  scale: 1.02,
  transition: springResponsive,
};

export const hoverLiftEffect = {
  y: -4,
  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
  transition: springResponsive,
};

export const tapEffect = {
  scale: 0.98,
  transition: springResponsive,
};

// ==========================================
// SCROLL ANIMATION VARIANTS
// ==========================================

export const scrollFadeUpVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 40,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      ...springGentle,
      delay: 0.1,
    },
  },
};

export const scrollScaleVariants: Variants = {
  offscreen: {
    opacity: 0,
    scale: 0.92,
  },
  onscreen: {
    opacity: 1,
    scale: 1,
    transition: {
      ...springSubtle,
      delay: 0.1,
    },
  },
};

// ==========================================
// MODAL / DIALOG VARIANTS
// ==========================================

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springSubtle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// ==========================================
// BUTTON VARIANTS
// ==========================================

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.03, transition: springResponsive },
  tap: { scale: 0.97, transition: springResponsive },
};

// ==========================================
// SIDEBAR / NAVIGATION VARIANTS
// ==========================================

export const sidebarItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSubtle,
  },
};

// ==========================================
// STAGGER DELAYS (utilities)
// ==========================================

export const getStaggerDelay = (index: number, baseDelay = 0.05) => ({
  transition: {
    ...springSubtle,
    delay: index * baseDelay,
  },
});

// ==========================================
// VIEWPORT OPTIONS FOR SCROLL ANIMATIONS
// ==========================================

export const scrollViewport = {
  once: true,
  margin: "-50px",
  amount: 0.3,
};
