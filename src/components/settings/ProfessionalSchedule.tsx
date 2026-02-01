import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Schedule {
  id?: string;
  profile_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working_day: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

const ProfessionalSchedule = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Default schedule template
  const getDefaultSchedule = (): Schedule[] => {
    return DAYS_OF_WEEK.map((day) => ({
      profile_id: profile?.id || "",
      clinic_id: profile?.clinic_id || "",
      day_of_week: day.value,
      start_time: "08:00",
      end_time: "18:00",
      is_working_day: day.value >= 1 && day.value <= 5, // Mon-Fri by default
    }));
  };

  // Fetch existing schedules
  const { data: existingSchedules = [], isLoading } = useQuery({
    queryKey: ["professional-schedules", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("professional_schedules")
        .select("*")
        .eq("profile_id", profile.id)
        .order("day_of_week");
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!profile?.id,
  });

  // Merge existing with defaults
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Initialize schedules when data loads
  useState(() => {
    if (existingSchedules.length > 0) {
      const merged = DAYS_OF_WEEK.map((day) => {
        const existing = existingSchedules.find((s) => s.day_of_week === day.value);
        if (existing) return existing;
        return {
          profile_id: profile?.id || "",
          clinic_id: profile?.clinic_id || "",
          day_of_week: day.value,
          start_time: "08:00",
          end_time: "18:00",
          is_working_day: false,
        };
      });
      setSchedules(merged);
    } else if (profile?.id && profile?.clinic_id) {
      setSchedules(getDefaultSchedule());
    }
  });

  // Update schedules when data loads
  if (existingSchedules.length > 0 && schedules.length === 0) {
    const merged = DAYS_OF_WEEK.map((day) => {
      const existing = existingSchedules.find((s) => s.day_of_week === day.value);
      if (existing) return existing;
      return {
        profile_id: profile?.id || "",
        clinic_id: profile?.clinic_id || "",
        day_of_week: day.value,
        start_time: "08:00",
        end_time: "18:00",
        is_working_day: false,
      };
    });
    setSchedules(merged);
  } else if (schedules.length === 0 && profile?.id && profile?.clinic_id) {
    setSchedules(getDefaultSchedule());
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (schedulesToSave: Schedule[]) => {
      if (!profile?.id || !profile?.clinic_id) throw new Error("No profile found");

      // Upsert each schedule
      for (const schedule of schedulesToSave) {
        const { error } = await supabase
          .from("professional_schedules")
          .upsert({
            profile_id: profile.id,
            clinic_id: profile.clinic_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_working_day: schedule.is_working_day,
          }, {
            onConflict: "profile_id,day_of_week",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-schedules"] });
      toast.success("Horarios guardados exitosamente");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error("Error al guardar horarios: " + error.message);
    },
  });

  const updateSchedule = (dayOfWeek: number, updates: Partial<Schedule>) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayOfWeek ? { ...s, ...updates } : s
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(schedules);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horario de Atención
        </CardTitle>
        <CardDescription>
          Configura tu horario de disponibilidad para agendar citas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedules.map((schedule) => {
          const day = DAYS_OF_WEEK.find((d) => d.value === schedule.day_of_week);
          return (
            <div
              key={schedule.day_of_week}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3 min-w-[140px]">
                <Switch
                  checked={schedule.is_working_day}
                  onCheckedChange={(checked) =>
                    updateSchedule(schedule.day_of_week, { is_working_day: checked })
                  }
                />
                <Label className="font-medium">{day?.label}</Label>
              </div>

              {schedule.is_working_day && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={schedule.start_time}
                    onValueChange={(value) =>
                      updateSchedule(schedule.day_of_week, { start_time: value })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">a</span>
                  <Select
                    value={schedule.end_time}
                    onValueChange={(value) =>
                      updateSchedule(schedule.day_of_week, { end_time: value })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!schedule.is_working_day && (
                <span className="text-sm text-muted-foreground">No disponible</span>
              )}
            </div>
          );
        })}

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Horarios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalSchedule;