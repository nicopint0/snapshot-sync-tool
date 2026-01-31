import { useCallback, useRef } from "react";

interface UsePrintOptions {
  title?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export function usePrint<T extends HTMLElement>(options: UsePrintOptions = {}) {
  const contentRef = useRef<T>(null);
  
  const handlePrint = useCallback(() => {
    if (!contentRef.current) return;
    
    const { title = document.title, onBeforePrint, onAfterPrint } = options;
    
    onBeforePrint?.();
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes para imprimir");
      return;
    }
    
    // Get all stylesheets
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join("\n");
        } catch {
          // External stylesheets may throw security errors
          if (sheet.href) {
            return `@import url("${sheet.href}");`;
          }
          return "";
        }
      })
      .join("\n");
    
    const content = contentRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${styles}
            
            /* Print-specific styles */
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .print\\:hidden {
                display: none !important;
              }
              
              .print\\:block {
                display: block !important;
              }
              
              .print\\:break-inside-avoid {
                break-inside: avoid;
              }
            }
            
            /* Reset for print */
            body {
              margin: 0;
              padding: 20px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 12px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
      onAfterPrint?.();
    };
  }, [options]);
  
  return {
    contentRef,
    handlePrint,
  };
}

export default usePrint;
