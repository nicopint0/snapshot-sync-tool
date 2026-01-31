import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
}

const Logo = ({ className, showText = true, size = "md", variant = "default" }: LogoProps) => {
  const sizeClasses = {
    sm: { container: "w-8 h-8", icon: "w-5 h-5", text: "text-lg" },
    md: { container: "w-10 h-10", icon: "w-6 h-6", text: "text-xl" },
    lg: { container: "w-12 h-12", icon: "w-8 h-8", text: "text-2xl" },
  };

  const containerColor = variant === "light" ? "bg-white/10" : "bg-primary";
  const iconColor = variant === "light" ? "text-white" : "text-primary-foreground";
  const textColor = variant === "light" ? "text-white" : "text-foreground";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "rounded-xl flex items-center justify-center",
        sizeClasses[size].container,
        containerColor
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn(sizeClasses[size].icon, iconColor)}
        >
          {/* Tooth icon */}
          <path d="M12 2C9.5 2 7.5 3.5 7 6c-.5 2.5.5 4.5 1 7 .5 2.5 0 5 0 7 0 1 1 2 2 2s2-1 2-3c0 2 1 3 2 3s2-1 2-2c0-2-.5-4.5 0-7s1.5-4.5 1-7c-.5-2.5-2.5-4-5-4z" />
        </svg>
      </div>
      {showText && (
        <span className={cn("font-bold", sizeClasses[size].text, textColor)}>
          Denty.io
        </span>
      )}
    </div>
  );
};

export default Logo;
