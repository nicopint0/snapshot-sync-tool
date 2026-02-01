import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface Dentist {
  first_name: string;
  last_name: string;
}

interface Treatment {
  name: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  notes: string | null;
  duration_minutes: number | null;
  reminder_sent: boolean;
  patients: Patient | null;
  dentist: Dentist | null;
  treatments: Treatment | null;
  clinic_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Obtener clínicas con recordatorios habilitados
    const { data: settings } = await supabase
      .from("email_settings")
      .select("clinic_id, reminder_hours_before, send_appointment_reminder")
      .eq("reminder_enabled", true)
      .eq("send_appointment_reminder", true);

    let totalSent = 0;
    const errors: string[] = [];

    for (const setting of settings || []) {
      try {
        // Calcular fecha objetivo basada en horas antes
        const hoursAhead = setting.reminder_hours_before || 24;
        const targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + hoursAhead);
        const targetDateStr = targetDate.toISOString().split("T")[0];

        // Obtener citas para ese día que no han recibido recordatorio
        const { data: appointments } = await supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            notes,
            duration_minutes,
            reminder_sent,
            clinic_id,
            patients (id, first_name, last_name, email),
            dentist:profiles!appointments_dentist_id_fkey (first_name, last_name),
            treatments (name)
          `)
          .eq("clinic_id", setting.clinic_id)
          .gte("scheduled_at", `${targetDateStr}T00:00:00`)
          .lte("scheduled_at", `${targetDateStr}T23:59:59`)
          .eq("reminder_sent", false)
          .in("status", ["scheduled", "confirmed"]);

        for (const apt of (appointments || []) as unknown as Appointment[]) {
          if (!apt.patients?.email) continue;

          const scheduledAt = new Date(apt.scheduled_at);
          const today = new Date();
          const isToday = scheduledAt.toDateString() === today.toDateString();

          const dateFormatted = scheduledAt.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });

          const timeFormatted = scheduledAt.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit"
          });

          // Enviar email
          await supabase.functions.invoke("send-email", {
            body: {
              to: apt.patients.email,
              template: "appointment_reminder",
              clinicId: apt.clinic_id,
              recipientType: "patient",
              recipientId: apt.patients.id,
              data: {
                patientName: `${apt.patients.first_name} ${apt.patients.last_name}`,
                date: dateFormatted,
                time: timeFormatted,
                dentistName: apt.dentist ? `${apt.dentist.first_name} ${apt.dentist.last_name}` : undefined,
                treatment: apt.treatments?.name,
                isToday,
                notes: apt.notes,
              }
            }
          });

          // Marcar como enviado
          await supabase
            .from("appointments")
            .update({ reminder_sent: true })
            .eq("id", apt.id);

          totalSent++;
        }
      } catch (err) {
        const error = err as Error;
        errors.push(`Clinic ${setting.clinic_id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error in send-reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
