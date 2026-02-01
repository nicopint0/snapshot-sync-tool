import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export type EmailTemplate =
  | "appointment_confirmation"
  | "appointment_reminder"
  | "appointment_cancelled"
  | "budget_created"
  | "payment_receipt"
  | "welcome"
  | "password_reset"
  | "user_invitation";

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  recipientType?: "patient" | "user";
  recipientId?: string;
  showToast?: boolean;
}

interface EmailError {
  message: string;
  code?: string;
  isConfigError?: boolean;
}

function parseEmailError(result: { success: boolean; error?: string; code?: string }): EmailError {
  const code = result.code || "UNKNOWN";
  
  const errorMessages: Record<string, EmailError> = {
    API_KEY_MISSING: {
      message: "El servicio de emails no está configurado",
      code,
      isConfigError: true,
    },
    API_KEY_INVALID: {
      message: "La configuración del servicio de emails es incorrecta",
      code,
      isConfigError: true,
    },
    RATE_LIMITED: {
      message: "Se ha excedido el límite de envíos. Intenta más tarde",
      code,
      isConfigError: false,
    },
    DOMAIN_ERROR: {
      message: "Error de configuración del dominio de emails",
      code,
      isConfigError: true,
    },
  };

  return errorMessages[code] || {
    message: result.error || "Error al enviar el email",
    code,
    isConfigError: false,
  };
}

export function useEmail() {
  const { profile } = useAuth();

  const sendEmail = useMutation({
    mutationFn: async ({ to, template, data, recipientType, recipientId }: SendEmailParams) => {
      if (!profile?.clinic_id) {
        throw new Error("No clinic found");
      }

      const { data: result, error } = await supabase.functions.invoke("send-email", {
        body: {
          to,
          template,
          data,
          clinicId: profile.clinic_id,
          recipientType,
          recipientId,
        },
      });

      if (error) throw error;
      
      if (!result?.success) {
        const parsedError = parseEmailError(result || {});
        const err = new Error(parsedError.message) as Error & { code?: string; isConfigError?: boolean };
        err.code = parsedError.code;
        err.isConfigError = parsedError.isConfigError;
        throw err;
      }
      
      return result;
    },
  });

  const sendEmailWithToast = useMutation({
    mutationFn: async (params: SendEmailParams) => {
      const result = await sendEmail.mutateAsync(params);
      return result;
    },
    onSuccess: () => {
      toast.success("Email enviado correctamente");
    },
    onError: (error: Error & { isConfigError?: boolean }) => {
      if (error.isConfigError) {
        toast.error(error.message, {
          description: "Contacta al administrador para configurar el servicio de emails",
        });
      } else {
        toast.error(`Error al enviar email: ${error.message}`);
      }
    },
  });

  return {
    sendEmail: sendEmail.mutate,
    sendEmailAsync: sendEmail.mutateAsync,
    sendEmailWithToast: sendEmailWithToast.mutate,
    sendEmailWithToastAsync: sendEmailWithToast.mutateAsync,
    isLoading: sendEmail.isPending || sendEmailWithToast.isPending,
    error: sendEmail.error || sendEmailWithToast.error,
  };
}
