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
      if (!result?.success) throw new Error(result?.error || "Error al enviar email");
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
    onError: (error) => {
      toast.error(`Error al enviar email: ${error.message}`);
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
