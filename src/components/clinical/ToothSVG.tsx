import { cn } from "@/lib/utils";

interface ToothSVGProps {
  number: number;
  isUpper: boolean;
  condition: string;
  isSelected: boolean;
  hasNotes: boolean;
  onClick: () => void;
  readOnly?: boolean;
}

// Map conditions to CSS classes using design system tokens
const CONDITION_STYLES: Record<string, { fill: string; stroke: string }> = {
  healthy: { fill: "fill-[hsl(var(--tooth-healthy))]", stroke: "stroke-border" },
  cavity: { fill: "fill-[hsl(var(--tooth-caries))]", stroke: "stroke-destructive" },
  filling: { fill: "fill-[hsl(var(--tooth-filling))]", stroke: "stroke-primary" },
  crown: { fill: "fill-[hsl(var(--tooth-crown))]", stroke: "stroke-yellow-600" },
  extraction: { fill: "fill-muted", stroke: "stroke-muted-foreground" },
  implant: { fill: "fill-purple-400", stroke: "stroke-purple-600" },
  root_canal: { fill: "fill-orange-400", stroke: "stroke-orange-600" },
  bridge: { fill: "fill-cyan-400", stroke: "stroke-cyan-600" },
  veneer: { fill: "fill-pink-400", stroke: "stroke-pink-600" },
};

// Tooth type based on position (simplified FDI)
const getToothType = (number: number): "molar" | "premolar" | "canine" | "incisor" => {
  const position = number % 10;
  if (position >= 6) return "molar";
  if (position >= 4) return "premolar";
  if (position === 3) return "canine";
  return "incisor";
};

// SVG paths for different tooth types
const ToothPaths = {
  molar: {
    upper: "M12 2C8 2 4 6 4 12C4 16 6 22 8 26C10 30 14 30 16 26C18 22 20 16 20 12C20 6 16 2 12 2Z M6 10C6 10 8 8 12 8C16 8 18 10 18 10 M8 16C8 16 10 18 12 18C14 18 16 16 16 16",
    lower: "M12 28C8 28 4 24 4 18C4 14 6 8 8 4C10 0 14 0 16 4C18 8 20 14 20 18C20 24 16 28 12 28Z M6 20C6 20 8 22 12 22C16 22 18 20 18 20 M8 14C8 14 10 12 12 12C14 12 16 14 16 14"
  },
  premolar: {
    upper: "M10 2C7 2 4 5 4 10C4 14 5 20 7 24C9 28 11 28 13 24C15 20 16 14 16 10C16 5 13 2 10 2Z M6 9C6 9 7 7 10 7C13 7 14 9 14 9",
    lower: "M10 28C7 28 4 25 4 20C4 16 5 10 7 6C9 2 11 2 13 6C15 10 16 16 16 20C16 25 13 28 10 28Z M6 21C6 21 7 23 10 23C13 23 14 21 14 21"
  },
  canine: {
    upper: "M9 2C6 2 4 6 4 11C4 16 5 22 7 26C8.5 29 9.5 29 11 26C13 22 14 16 14 11C14 6 12 2 9 2Z",
    lower: "M9 28C6 28 4 24 4 19C4 14 5 8 7 4C8.5 1 9.5 1 11 4C13 8 14 14 14 19C14 24 12 28 9 28Z"
  },
  incisor: {
    upper: "M8 2C5 2 3 5 3 9C3 13 4 19 5.5 23C7 27 9 27 10.5 23C12 19 13 13 13 9C13 5 11 2 8 2Z",
    lower: "M8 28C5 28 3 25 3 21C3 17 4 11 5.5 7C7 3 9 3 10.5 7C12 11 13 17 13 21C13 25 11 28 8 28Z"
  }
};

const ToothSVG = ({
  number,
  isUpper,
  condition,
  isSelected,
  hasNotes,
  onClick,
  readOnly = false
}: ToothSVGProps) => {
  const toothType = getToothType(number);
  const styles = CONDITION_STYLES[condition] || CONDITION_STYLES.healthy;
  const path = isUpper ? ToothPaths[toothType].upper : ToothPaths[toothType].lower;
  
  // Determine size based on tooth type
  const dimensions = {
    molar: { width: 24, height: 30, viewBox: "0 0 24 30" },
    premolar: { width: 20, height: 30, viewBox: "0 0 20 30" },
    canine: { width: 18, height: 30, viewBox: "0 0 18 30" },
    incisor: { width: 16, height: 30, viewBox: "0 0 16 30" }
  };
  
  const { width, height, viewBox } = dimensions[toothType];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center cursor-pointer transition-all duration-200 group",
        !readOnly && "hover:scale-110",
        isSelected && "scale-110"
      )}
    >
      {/* Tooth number - top for upper, bottom for lower */}
      {isUpper && (
        <span className={cn(
          "text-[10px] font-semibold mb-0.5 transition-colors",
          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {number}
        </span>
      )}
      
      {/* Tooth SVG */}
      <div className={cn(
        "relative rounded-sm transition-all duration-200",
        isSelected && "ring-2 ring-primary ring-offset-1"
      )}>
        <svg
          width={width}
          height={height}
          viewBox={viewBox}
          className={cn(
            "transition-all duration-200",
            styles.fill,
            styles.stroke,
            "stroke-[1.5]",
            condition === "extraction" && "opacity-40"
          )}
        >
          <path d={path} />
          {/* Root indication for certain conditions */}
          {condition === "root_canal" && (
            <line
              x1={width / 2}
              y1={isUpper ? height - 6 : 6}
              x2={width / 2}
              y2={isUpper ? height : 0}
              className="stroke-orange-600 stroke-2"
            />
          )}
          {/* X mark for extraction */}
          {condition === "extraction" && (
            <>
              <line x1="3" y1="5" x2={width - 3} y2={height - 5} className="stroke-destructive stroke-2" />
              <line x1={width - 3} y1="5" x2="3" y2={height - 5} className="stroke-destructive stroke-2" />
            </>
          )}
        </svg>
        
        {/* Notes indicator */}
        {hasNotes && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Tooth number - bottom for lower */}
      {!isUpper && (
        <span className={cn(
          "text-[10px] font-semibold mt-0.5 transition-colors",
          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {number}
        </span>
      )}
    </div>
  );
};

export default ToothSVG;
