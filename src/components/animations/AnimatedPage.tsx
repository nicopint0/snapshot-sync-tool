import { ReactNode } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/animations";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for page-level animations
 * Provides consistent enter/exit animations with spring physics
 */
const AnimatedPage = ({ children, className = "" }: AnimatedPageProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
