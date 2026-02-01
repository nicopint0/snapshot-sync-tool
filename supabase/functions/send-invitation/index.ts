import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicName: string;
  inviterName: string;
  inviteUrl: string;
}

const getRoleLabel = (role: string): string => {
  const roles: Record<string, string> = {
    admin: "Administrador",
    dentist: "Profesional (Dentista)",
    assistant: "Asistente",
    receptionist: "Recepcionista",
  };
  return roles[role] || role;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { email, firstName, lastName, role, clinicName, inviterName, inviteUrl }: InvitationRequest = await req.json();

    if (!email || !firstName || !clinicName || !inviteUrl) {
      throw new Error("Faltan campos requeridos");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Denty.io <onboarding@resend.dev>",
        to: [email],
        subject: `${inviterName} te ha invitado a unirte a ${clinicName} - Denty.io`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0;">Denty.io</h1>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1e293b;">¡Hola ${firstName}!</h2>
              <p><strong>${inviterName}</strong> te ha invitado a unirte al equipo de <strong>${clinicName}</strong> en Denty.io.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <p style="margin: 0;"><strong>Tu rol:</strong> ${getRoleLabel(role)}</p>
                <p style="margin: 10px 0 0 0;"><strong>Clínica:</strong> ${clinicName}</p>
              </div>
              
              <p>Para aceptar esta invitación y configurar tu cuenta, haz clic en el siguiente botón:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Aceptar Invitación
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                Si no esperabas esta invitación, puedes ignorar este correo.
              </p>
              <p style="color: #64748b; font-size: 14px;">
                Esta invitación expira en 7 días.
              </p>
            </div>
            
            <div style="text-align: center; color: #94a3b8; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Denty.io - Software para Clínicas Dentales</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Error sending email");
    }

    console.log("Invitation email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
