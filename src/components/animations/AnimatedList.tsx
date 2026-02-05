import { ReactNode, Children, cloneElement, isValidElement } from "react";
import { motion, Variants } from "framer-motion";
import { springSubtle } from "@/lib/animations";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { staggerDelay: number; initialDelay: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.staggerDelay,
      delayChildren: custom.initialDelay,
    },
  }),
};

const itemVariants: Variants = {
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

/**
 * Animated list with staggered children
 * Automatically wraps children with motion.div
 */
const AnimatedList = ({ 
  children, 
  className = "",
  staggerDelay = 0.06,
  initialDelay = 0.05,
}: AnimatedListProps) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={{ staggerDelay, initialDelay }}
      className={className}
    >
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        
        return (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default AnimatedList;
