import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { 
  scrollFadeUpVariants, 
  scrollScaleVariants, 
  scrollViewport,
  springGentle,
} from "@/lib/animations";

type ScrollAnimation = "fadeUp" | "scale" | "slideLeft" | "slideRight";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: ScrollAnimation;
  delay?: number;
  once?: boolean;
}

const getScrollVariants = (animation: ScrollAnimation, delay: number): Variants => {
  const baseVariants: Record<ScrollAnimation, Variants> = {
    fadeUp: {
      offscreen: { opacity: 0, y: 50 },
      onscreen: { 
        opacity: 1, 
        y: 0, 
        transition: { ...springGentle, delay } 
      },
    },
    scale: {
      offscreen: { opacity: 0, scale: 0.9 },
      onscreen: { 
        opacity: 1, 
        scale: 1, 
        transition: { ...springGentle, delay } 
      },
    },
    slideLeft: {
      offscreen: { opacity: 0, x: -50 },
      onscreen: { 
        opacity: 1, 
        x: 0, 
        transition: { ...springGentle, delay } 
      },
    },
    slideRight: {
      offscreen: { opacity: 0, x: 50 },
      onscreen: { 
        opacity: 1, 
        x: 0, 
        transition: { ...springGentle, delay } 
      },
    },
  };
  
  return baseVariants[animation];
};

/**
 * Component that animates when scrolled into view
 * Perfect for landing pages and long content
 */
const ScrollReveal = ({ 
  children, 
  className = "",
  animation = "fadeUp",
  delay = 0,
  once = true,
}: ScrollRevealProps) => {
  return (
    <motion.div
      variants={getScrollVariants(animation, delay)}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once, margin: "-80px", amount: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
