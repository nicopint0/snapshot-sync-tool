import { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerContainerVariants } from "@/lib/animations";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Container that staggers animations for its children
 * Use with AnimatedItem for list/grid layouts
 */
const AnimatedContainer = ({ 
  children, 
  className = "",
  delay = 0,
}: AnimatedContainerProps) => {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContainer;
