import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  template: string;
  data: Record<string, unknown>;
  clinicId: string;
  recipientType?: "patient" | "user";
  recipientId?: string;
  testConnection?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key exists
    if (!RESEND_API_KEY || RESEND_API_KEY.trim() === "") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY no configurada", 
          code: "API_KEY_MISSING" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: EmailRequest = await req.json();
    
    // Handle test connection request
    if (body.testConnection) {
      try {
        // Try to get API key info to validate it works
        const testResponse = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
        });
        
        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorData.message || "API key inválida",
              code: "API_KEY_INVALID"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: "Conexión exitosa con Resend" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (testError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "No se pudo conectar con Resend",
            code: "CONNECTION_ERROR"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { to, template, data, clinicId, recipientType, recipientId } = body;

    // Obtener configuración de la clínica
    const { data: settings } = await supabase
      .from("email_settings")
      .select("*")
      .eq("clinic_id", clinicId)
      .single();

    // Obtener datos de la clínica
    const { data: clinic } = await supabase
      .from("clinics")
      .select("name, email, phone, address, logo_url")
      .eq("id", clinicId)
      .single();

    // Enriquecer data con información de la clínica
    const enrichedData = {
      ...data,
      clinicName: clinic?.name || "Clínica Dental",
      clinicEmail: clinic?.email,
      clinicPhone: clinic?.phone,
      clinicAddress: clinic?.address,
      clinicLogo: clinic?.logo_url,
      signature: settings?.email_signature || "",
      year: new Date().getFullYear(),
    };

    // Generar el email
    const emailContent = generateEmailTemplate(template, enrichedData);

    if (!emailContent) {
      throw new Error(`Template "${template}" no encontrado`);
    }

    // Enviar con Resend
    const fromName = settings?.from_name || clinic?.name || "Clínica Dental";
    const replyTo = settings?.reply_to_email || clinic?.email;

    const { data: result, error } = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
      reply_to: replyTo || undefined,
    });

    if (error) throw error;

    // Guardar log
    await supabase.from("email_logs").insert({
      clinic_id: clinicId,
      recipient_email: to,
      recipient_type: recipientType || "patient",
      recipient_id: recipientId,
      template_name: template,
      subject: emailContent.subject,
      status: "sent",
      resend_id: result?.id,
      metadata: { data: enrichedData },
    });

    return new Response(
      JSON.stringify({ success: true, id: result?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error sending email:", error);

    // Check for common Resend errors
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = error.message;
    
    if (error.message?.includes("API key is invalid")) {
      errorCode = "API_KEY_INVALID";
      errorMessage = "La API key de Resend no es válida. Verifica tu configuración.";
    } else if (error.message?.includes("rate limit")) {
      errorCode = "RATE_LIMITED";
      errorMessage = "Se ha excedido el límite de envíos. Intenta más tarde.";
    } else if (error.message?.includes("domain")) {
      errorCode = "DOMAIN_ERROR";
      errorMessage = "Problema con el dominio de envío. Verifica tu configuración en Resend.";
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, code: errorCode }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generador de templates
function generateEmailTemplate(templateName: string, data: Record<string, unknown>): { subject: string; html: string } | null {
  const templates: Record<string, (d: Record<string, unknown>) => { subject: string; html: string }> = {

    // ========== CITAS ==========
    appointment_confirmation: (d) => ({
      subject: `✅ Cita confirmada - ${d.date} a las ${d.time}`,
      html: baseTemplate(d, `
        <h2 style="color: #10B981; margin-bottom: 20px;">¡Tu cita ha sido confirmada!</h2>
        <p>Hola <strong>${d.patientName}</strong>,</p>
        <p>Te confirmamos tu cita en <strong>${d.clinicName}</strong>:</p>

        ${appointmentCard(d)}

        <p style="margin-top: 20px;">Te esperamos puntualmente. Si necesitas cancelar o reagendar, por favor contáctanos con al menos 24 horas de anticipación.</p>
      `)
    }),

    appointment_reminder: (d) => ({
      subject: `⏰ Recordatorio: Tu cita es ${d.isToday ? "HOY" : "mañana"} a las ${d.time}`,
      html: baseTemplate(d, `
        <h2 style="color: #F59E0B; margin-bottom: 20px;">📅 Recordatorio de cita</h2>
        <p>Hola <strong>${d.patientName}</strong>,</p>
        <p>Te recordamos que tienes una cita programada ${d.isToday ? "<strong>HOY</strong>" : "para <strong>mañana</strong>"}:</p>

        ${appointmentCard(d)}

        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <strong>💡 Recomendaciones:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Llega 10 minutos antes de tu cita</li>
            <li>Trae tu documento de identidad</li>
            ${d.notes ? `<li>${d.notes}</li>` : ""}
          </ul>
        </div>

        <p>Si no puedes asistir, por favor avísanos lo antes posible.</p>

        ${d.confirmUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${d.confirmUrl}" style="background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirmar asistencia</a>
          </div>
        ` : ""}
      `)
    }),

    appointment_cancelled: (d) => ({
      subject: `❌ Cita cancelada - ${d.date}`,
      html: baseTemplate(d, `
        <h2 style="color: #EF4444; margin-bottom: 20px;">Cita cancelada</h2>
        <p>Hola <strong>${d.patientName}</strong>,</p>
        <p>Tu cita ha sido cancelada:</p>

        <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Fecha:</strong> ${d.date}</p>
          <p style="margin: 10px 0 0 0;"><strong>🕐 Hora:</strong> ${d.time}</p>
          ${d.reason ? `<p style="margin: 10px 0 0 0;"><strong>Motivo:</strong> ${d.reason}</p>` : ""}
        </div>

        <p>Si deseas reagendar tu cita, por favor contáctanos.</p>
      `)
    }),

    // ========== PRESUPUESTOS ==========
    budget_created: (d) => ({
      subject: `📋 Nuevo presupuesto #${d.budgetNumber} - ${d.clinicName}`,
      html: baseTemplate(d, `
        <h2 style="color: #10B981; margin-bottom: 20px;">Presupuesto de tratamiento</h2>
        <p>Hola <strong>${d.patientName}</strong>,</p>
        <p>Hemos preparado un presupuesto para ti:</p>

        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="color: #6B7280;">Presupuesto N°</span>
            <strong>${d.budgetNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="color: #6B7280;">Fecha</span>
            <span>${d.date}</span>
          </div>
          ${d.validUntil ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="color: #6B7280;">Válido hasta</span>
            <span>${d.validUntil}</span>
          </div>
          ` : ""}

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 15px 0;">

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <th style="text-align: left; padding: 10px 0; color: #6B7280; font-weight: 500;">Tratamiento</th>
                <th style="text-align: right; padding: 10px 0; color: #6B7280; font-weight: 500;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${(d.items as Array<{ description: string; total: number }>)?.map((item) => `
                <tr style="border-bottom: 1px solid #F3F4F6;">
                  <td style="padding: 12px 0;">${item.description}</td>
                  <td style="padding: 12px 0; text-align: right;">$${item.total?.toLocaleString()}</td>
                </tr>
              `).join("") || ""}
            </tbody>
          </table>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 15px 0;">

          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700;">
            <span>Total</span>
            <span style="color: #10B981;">$${(d.total as number)?.toLocaleString()}</span>
          </div>
        </div>

        ${d.notes ? `<p style="color: #6B7280; font-style: italic;">${d.notes}</p>` : ""}

        <p style="color: #6B7280; font-size: 14px;">Contáctanos si tienes alguna pregunta.</p>
      `)
    }),

    // ========== PAGOS ==========
    payment_receipt: (d) => ({
      subject: `🧾 Recibo de pago - $${(d.amount as number)?.toLocaleString()} - ${d.clinicName}`,
      html: baseTemplate(d, `
        <h2 style="color: #10B981; margin-bottom: 20px;">Comprobante de pago</h2>
        <p>Hola <strong>${d.patientName}</strong>,</p>
        <p>Hemos recibido tu pago correctamente. Aquí está el comprobante:</p>

        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;">Monto pagado</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 700; color: #10B981;">$${(d.amount as number)?.toLocaleString()}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 15px 0;">

          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6B7280;">Fecha</span>
            <span>${d.date}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6B7280;">Método de pago</span>
            <span>${d.paymentMethod}</span>
          </div>
        </div>

        <p style="color: #6B7280; font-size: 14px;">Guarda este correo como comprobante de tu pago.</p>
      `)
    }),

    // ========== AUTENTICACIÓN ==========
    password_reset: (d) => ({
      subject: `🔐 Restablecer tu contraseña`,
      html: baseTemplate(d, `
        <h2 style="color: #3B82F6; margin-bottom: 20px;">Restablecer contraseña</h2>
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${d.resetUrl}" style="background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Restablecer contraseña</a>
        </div>

        <p style="color: #6B7280; font-size: 14px;">Este enlace expirará en 1 hora.</p>
        <p style="color: #6B7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
      `)
    }),

    // ========== BIENVENIDA ==========
    welcome: (d) => ({
      subject: `👋 ¡Bienvenido a ${d.clinicName}!`,
      html: baseTemplate(d, `
        <h2 style="color: #10B981; margin-bottom: 20px;">¡Bienvenido a nuestra clínica!</h2>
        <p>Hola <strong>${d.patientName}</strong>,</p>
        <p>Gracias por registrarte en <strong>${d.clinicName}</strong>. Estamos encantados de tenerte como paciente.</p>

        <div style="background: #F0FDF4; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #166534;">¿Qué puedes hacer ahora?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #15803D;">
            <li style="margin-bottom: 10px;">📅 Agendar tu primera cita</li>
            <li style="margin-bottom: 10px;">📋 Completar tu ficha médica</li>
            <li style="margin-bottom: 10px;">💬 Contactarnos por WhatsApp</li>
          </ul>
        </div>

        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `)
    }),

    // ========== INVITACIÓN USUARIO ==========
    user_invitation: (d) => ({
      subject: `📧 Invitación para unirte a ${d.clinicName}`,
      html: baseTemplate(d, `
        <h2 style="color: #10B981; margin-bottom: 20px;">Has sido invitado</h2>
        <p>Hola,</p>
        <p>Has sido invitado a unirte al equipo de <strong>${d.clinicName}</strong> como <strong>${d.role}</strong>.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${d.inviteUrl}" style="background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Aceptar invitación</a>
        </div>

        <p style="color: #6B7280; font-size: 14px;">Este enlace expirará en 7 días.</p>
      `)
    }),
  };

  const templateFn = templates[templateName];
  return templateFn ? templateFn(data) : null;
}

// Template base
function baseTemplate(data: Record<string, unknown>, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.clinicName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  ${data.clinicLogo
                    ? `<img src="${data.clinicLogo}" alt="${data.clinicName}" style="max-height: 50px; margin-bottom: 10px;">`
                    : `<h1 style="color: white; margin: 0; font-size: 28px;">🦷 ${data.clinicName}</h1>`
                  }
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="background: white; padding: 40px; border-radius: 0 0 12px 12px;">
                  ${content}

                  ${data.signature ? `
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                      <p style="color: #6B7280; white-space: pre-line;">${data.signature}</p>
                    </div>
                  ` : ""}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <p style="margin: 0; color: #6B7280; font-size: 14px;">
                    ${data.clinicName}
                    ${data.clinicAddress ? `<br>${data.clinicAddress}` : ""}
                    ${data.clinicPhone ? `<br>📞 ${data.clinicPhone}` : ""}
                    ${data.clinicEmail ? `<br>✉️ ${data.clinicEmail}` : ""}
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px;">
                    © ${data.year} ${data.clinicName}
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Card de cita reutilizable
function appointmentCard(data: Record<string, unknown>): string {
  return `
    <div style="background: #F9FAFB; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="30" style="vertical-align: top; padding-right: 10px;">📅</td>
          <td><strong>Fecha:</strong> ${data.date}</td>
        </tr>
        <tr>
          <td width="30" style="vertical-align: top; padding-right: 10px; padding-top: 10px;">🕐</td>
          <td style="padding-top: 10px;"><strong>Hora:</strong> ${data.time}</td>
        </tr>
        ${data.dentistName ? `
          <tr>
            <td width="30" style="vertical-align: top; padding-right: 10px; padding-top: 10px;">👨‍⚕️</td>
            <td style="padding-top: 10px;"><strong>Profesional:</strong> ${data.dentistName}</td>
          </tr>
        ` : ""}
        ${data.treatment ? `
          <tr>
            <td width="30" style="vertical-align: top; padding-right: 10px; padding-top: 10px;">🦷</td>
            <td style="padding-top: 10px;"><strong>Tratamiento:</strong> ${data.treatment}</td>
          </tr>
        ` : ""}
        ${data.clinicAddress ? `
          <tr>
            <td width="30" style="vertical-align: top; padding-right: 10px; padding-top: 10px;">📍</td>
            <td style="padding-top: 10px;"><strong>Dirección:</strong> ${data.clinicAddress}</td>
          </tr>
        ` : ""}
      </table>
    </div>
  `;
}
