import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  notes: string | null;
  dentist_id: string | null;
  treatment_id: string | null;
  patients: {
    first_name: string;
    last_name: string;
  };
  treatments?: {
    name: string;
  } | null;
}

interface Treatment {
  id: string;
  name: string;
  duration_minutes: number | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

interface ProfessionalSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working_day: boolean;
  profile_id: string;
}

export interface EditAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

const EditAppointmentModal = ({ open, onOpenChange, appointment }: EditAppointmentModalProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    scheduled_date: undefined as Date | undefined,
    scheduled_time: "09:00",
    duration_minutes: 30,
    dentist_id: "",
    treatment_id: "",
    notes: "",
  });

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment) {
      const scheduledAt = new Date(appointment.scheduled_at);
      setFormData({
        scheduled_date: scheduledAt,
        scheduled_time: format(scheduledAt, "HH:mm"),
        duration_minutes: appointment.duration_minutes || 30,
        dentist_id: appointment.dentist_id || "",
        treatment_id: appointment.treatment_id || "",
        notes: appointment.notes || "",
      });
      setScheduleWarning(null);
    }
  }, [appointment]);

  // Fetch treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ["treatments", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      const { data, error } = await supabase
        .from("treatments")
        .select("id, name, duration_minutes")
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Treatment[];
    },
    enabled: !!profile?.clinic_id && open,
  });

  // Fetch dentists
  const { data: dentists = [] } = useQuery({
    queryKey: ["dentists", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("clinic_id", profile.clinic_id)
        .order("first_name");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!profile?.clinic_id && open,
  });

  // Fetch professional schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ["professional-schedules", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      const { data, error } = await supabase
        .from("professional_schedules")
        .select("*")
        .eq("clinic_id", profile.clinic_id);
      if (error) throw error;
      return data as ProfessionalSchedule[];
    },
    enabled: !!profile?.clinic_id && open,
  });

  // Validate schedule when date/time/dentist changes
  useEffect(() => {
    if (!formData.scheduled_date || !formData.scheduled_time) {
      setScheduleWarning(null);
      return;
    }

    const dayOfWeek = formData.scheduled_date.getDay();
    const [hours, minutes] = formData.scheduled_time.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;

    // If dentist is selected, check their schedule
    if (formData.dentist_id) {
      const dentistSchedule = schedules.find(
        s => s.profile_id === formData.dentist_id && s.day_of_week === dayOfWeek
      );

      if (dentistSchedule) {
        if (!dentistSchedule.is_working_day) {
          setScheduleWarning("El dentista no trabaja este día");
          return;
        }

        const [startH, startM] = dentistSchedule.start_time.split(":").map(Number);
        const [endH, endM] = dentistSchedule.end_time.split(":").map(Number);
        const startInMinutes = startH * 60 + startM;
        const endInMinutes = endH * 60 + endM;

        if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
          setScheduleWarning(
            `Fuera del horario del dentista (${dentistSchedule.start_time} - ${dentistSchedule.end_time})`
          );
          return;
        }
      }
    }

    // Check if there's any schedule for the day (clinic level)
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek && s.is_working_day);
    if (daySchedules.length > 0) {
      const earliestStart = Math.min(...daySchedules.map(s => {
        const [h, m] = s.start_time.split(":").map(Number);
        return h * 60 + m;
      }));
      const latestEnd = Math.max(...daySchedules.map(s => {
        const [h, m] = s.end_time.split(":").map(Number);
        return h * 60 + m;
      }));

      if (timeInMinutes < earliestStart || timeInMinutes >= latestEnd) {
        const earliestTime = `${Math.floor(earliestStart / 60).toString().padStart(2, "0")}:${(earliestStart % 60).toString().padStart(2, "0")}`;
        const latestTime = `${Math.floor(latestEnd / 60).toString().padStart(2, "0")}:${(latestEnd % 60).toString().padStart(2, "0")}`;
        setScheduleWarning(`Fuera del horario de la clínica (${earliestTime} - ${latestTime})`);
        return;
      }
    }

    setScheduleWarning(null);
  }, [formData.scheduled_date, formData.scheduled_time, formData.dentist_id, schedules]);

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) throw new Error("No appointment");
      if (!formData.scheduled_date) throw new Error("No date selected");
      
      // Combine date and time
      const scheduledAt = new Date(formData.scheduled_date);
      const [hours, minutes] = formData.scheduled_time.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: formData.duration_minutes,
          dentist_id: formData.dentist_id || null,
          treatment_id: formData.treatment_id || null,
          notes: formData.notes || null,
        })
        .eq("id", appointment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita actualizada exitosamente");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error al actualizar cita: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.scheduled_date) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (scheduleWarning) {
      toast.error("No puedes agendar fuera del horario configurado");
      return;
    }
    
    updateMutation.mutate();
  };

  const handleSelectTreatment = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    setFormData((prev) => ({ 
      ...prev, 
      treatment_id: treatmentId,
      duration_minutes: treatment?.duration_minutes || prev.duration_minutes,
    }));
  };

  // Generate time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? "00" : "30";
    if (hour > 19) return null;
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  }).filter(Boolean) as string[];

  if (!appointment) return null;

  const patientName = `${appointment.patients.first_name} ${appointment.patients.last_name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
          <DialogDescription>
            Modifica la cita de {patientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Schedule Warning */}
          {scheduleWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scheduleWarning}</AlertDescription>
            </Alert>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date ? (
                      format(formData.scheduled_date, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_date}
                    onSelect={(date) => {
                      setFormData((prev) => ({ ...prev, scheduled_date: date }));
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Select
                value={formData.scheduled_time}
                onValueChange={(v) => setFormData({ ...formData, scheduled_time: v })}
              >
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duración (minutos)</Label>
            <Select
              value={formData.duration_minutes.toString()}
              onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dentist */}
          <div className="space-y-2">
            <Label>Dentista</Label>
            <Select
              value={formData.dentist_id}
              onValueChange={(v) => setFormData({ ...formData, dentist_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dentista..." />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id}>
                    {dentist.first_name} {dentist.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment */}
          <div className="space-y-2">
            <Label>Tratamiento</Label>
            <Select
              value={formData.treatment_id}
              onValueChange={handleSelectTreatment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tratamiento..." />
              </SelectTrigger>
              <SelectContent>
                {treatments.map((treatment) => (
                  <SelectItem key={treatment.id} value={treatment.id}>
                    {treatment.name} ({treatment.duration_minutes || 30} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !!scheduleWarning}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentModal;
