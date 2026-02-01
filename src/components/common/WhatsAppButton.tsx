import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phoneNumber: string;
  defaultMessage: string;
  variant?: "icon" | "button";
  className?: string;
  onClick?: () => void;
}

const WhatsAppButton = ({
  phoneNumber,
  defaultMessage,
  variant = "icon",
  className,
  onClick,
}: WhatsAppButtonProps) => {
  // Sanitize phone number - remove any non-numeric characters
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  
  // Encode message for URL (supports spaces, accents, emojis)
  const encodedMessage = encodeURIComponent(defaultMessage);
  
  // Build WhatsApp Web URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        asChild
        className={cn(className)}
        title="Enviar por WhatsApp"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
        </a>
      </Button>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 text-sm",
        className
      )}
    >
      <MessageCircle className="h-4 w-4 text-green-600" />
      Enviar por WhatsApp
    </a>
  );
};

export default WhatsAppButton;
