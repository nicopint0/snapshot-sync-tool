import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
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

export interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
}

interface AppointmentData {
  patient_id: string;
  scheduled_date: Date | undefined;
  scheduled_time: string;
  duration_minutes: number;
  dentist_id: string;
  treatment_id: string;
  notes: string;
}

const NewAppointmentModal = ({ open, onOpenChange, preselectedPatientId }: NewAppointmentModalProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [appointment, setAppointment] = useState<AppointmentData>({
    patient_id: "",
    scheduled_date: undefined,
    scheduled_time: "09:00",
    duration_minutes: 30,
    dentist_id: "",
    treatment_id: "",
    notes: "",
  });

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ["patients-search", profile?.clinic_id, patientSearch],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      let query = supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("clinic_id", profile.clinic_id)
        .order("first_name")
        .limit(20);
      
      if (patientSearch) {
        query = query.or(
          `first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%`
        );
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!profile?.clinic_id && open,
  });

  // Set preselected patient when dialog opens
  useEffect(() => {
    if (open && preselectedPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === preselectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
        setAppointment(prev => ({ ...prev, patient_id: patient.id }));
      }
    }
  }, [open, preselectedPatientId, patients]);

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

  // Fetch dentists (profiles in clinic)
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

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: AppointmentData) => {
      if (!profile?.clinic_id) throw new Error("No clinic found");
      if (!data.scheduled_date) throw new Error("No date selected");
      
      // Combine date and time
      const scheduledAt = new Date(data.scheduled_date);
      const [hours, minutes] = data.scheduled_time.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      const { error } = await supabase.from("appointments").insert({
        clinic_id: profile.clinic_id,
        patient_id: data.patient_id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: data.duration_minutes,
        dentist_id: data.dentist_id || null,
        treatment_id: data.treatment_id || null,
        notes: data.notes || null,
        status: "scheduled",
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita creada exitosamente");
      handleClose();
    },
    onError: (error) => {
      toast.error("Error al crear cita: " + error.message);
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setSelectedPatient(null);
    setAppointment({
      patient_id: "",
      scheduled_date: undefined,
      scheduled_time: "09:00",
      duration_minutes: 30,
      dentist_id: "",
      treatment_id: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment.patient_id) {
      toast.error("Selecciona un paciente");
      return;
    }
    
    if (!appointment.scheduled_date) {
      toast.error("Selecciona una fecha");
      return;
    }
    
    createMutation.mutate(appointment);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setAppointment((prev) => ({ ...prev, patient_id: patient.id }));
    setPatientOpen(false);
  };

  const handleSelectTreatment = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    setAppointment((prev) => ({ 
      ...prev, 
      treatment_id: treatmentId,
      duration_minutes: treatment?.duration_minutes || 30,
    }));
  };

  // Generate time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? "00" : "30";
    if (hour > 19) return null;
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  }).filter(Boolean) as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            Programa una nueva cita para un paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient selector */}
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Popover open={patientOpen} onOpenChange={setPatientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientOpen}
                  className="w-full justify-between"
                >
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : "Buscar paciente..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar por nombre..."
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.first_name} ${patient.last_name}`}
                          onSelect={() => handleSelectPatient(patient)}
                        >
                          {patient.first_name} {patient.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

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
                      !appointment.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointment.scheduled_date ? (
                      format(appointment.scheduled_date, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={appointment.scheduled_date}
                    onSelect={(date) => {
                      setAppointment((prev) => ({ ...prev, scheduled_date: date }));
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Select
                value={appointment.scheduled_time}
                onValueChange={(v) => setAppointment({ ...appointment, scheduled_time: v })}
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
              value={appointment.duration_minutes.toString()}
              onValueChange={(v) => setAppointment({ ...appointment, duration_minutes: parseInt(v) })}
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
              value={appointment.dentist_id}
              onValueChange={(v) => setAppointment({ ...appointment, dentist_id: v })}
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
              value={appointment.treatment_id}
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
              value={appointment.notes}
              onChange={(e) => setAppointment({ ...appointment, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Cita"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
