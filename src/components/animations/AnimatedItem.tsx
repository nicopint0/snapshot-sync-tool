import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { 
  fadeUpVariants, 
  scaleInVariants, 
  slideInLeftVariants,
  slideInRightVariants,
  cardVariants,
  statCardVariants,
  tableRowVariants,
  hoverLiftEffect,
  tapEffect,
} from "@/lib/animations";

type AnimationType = 
  | "fadeUp" 
  | "scaleIn" 
  | "slideLeft" 
  | "slideRight" 
  | "card" 
  | "statCard"
  | "tableRow";

interface AnimatedItemProps {
  children: ReactNode;
  animation?: AnimationType;
  className?: string;
  hover?: boolean;
  tap?: boolean;
  custom?: number;
}

const animationMap: Record<AnimationType, Variants> = {
  fadeUp: fadeUpVariants,
  scaleIn: scaleInVariants,
  slideLeft: slideInLeftVariants,
  slideRight: slideInRightVariants,
  card: cardVariants,
  statCard: statCardVariants,
  tableRow: tableRowVariants,
};

/**
 * Flexible animated item component
 * Works as child of AnimatedContainer for staggered animations
 */
const AnimatedItem = ({ 
  children, 
  animation = "fadeUp",
  className = "",
  hover = false,
  tap = false,
  custom,
}: AnimatedItemProps) => {
  return (
    <motion.div
      variants={animationMap[animation]}
      className={className}
      whileHover={hover ? hoverLiftEffect : undefined}
      whileTap={tap ? tapEffect : undefined}
      custom={custom}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedItem;
