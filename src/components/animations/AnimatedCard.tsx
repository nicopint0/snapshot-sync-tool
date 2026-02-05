import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cardVariants, hoverLiftEffect, springResponsive } from "@/lib/animations";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Card component with spring animations
 * Subtle lift effect on hover for interactive cards
 */
const AnimatedCard = ({ 
  children, 
  className = "",
  hover = true,
  onClick,
}: AnimatedCardProps) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={hover ? hoverLiftEffect : undefined}
      whileTap={onClick ? { scale: 0.99, transition: springResponsive } : undefined}
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
