import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PrintableSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const PrintableSection = forwardRef<HTMLDivElement, PrintableSectionProps>(
  ({ children, title, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "print:break-inside-avoid",
          className
        )}
      >
        {title && (
          <h2 className="hidden print:block text-lg font-bold mb-4 border-b pb-2">
            {title}
          </h2>
        )}
        {children}
      </div>
    );
  }
);

PrintableSection.displayName = "PrintableSection";

export default PrintableSection;
