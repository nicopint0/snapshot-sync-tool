import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Phone,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  PlayCircle,
  Check,
  Loader2,
  Pencil,
  Mail,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AppLayout from "@/components/layout/AppLayout";
import NewAppointmentModal from "@/components/appointments/NewAppointmentModal";
import EditAppointmentModal from "@/components/appointments/EditAppointmentModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmail } from "@/hooks/useEmail";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  notes: string | null;
  dentist_id: string | null;
  treatment_id: string | null;
  reminder_sent?: boolean;
  confirmation_sent?: boolean;
  patients: {
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  };
  treatments?: {
    name: string;
  } | null;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

const Appointments = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { sendEmailAsync, isLoading: isSendingEmail } = useEmail();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Send reminder email
  const handleSendReminder = async (apt: Appointment) => {
    if (!apt.patients.email) {
      toast.error("El paciente no tiene email registrado");
      return;
    }

    const scheduledAt = new Date(apt.scheduled_at);
    const dateFormatted = format(scheduledAt, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    const timeFormatted = format(scheduledAt, "HH:mm");
    const isToday = scheduledAt.toDateString() === new Date().toDateString();

    try {
      await sendEmailAsync({
        to: apt.patients.email,
        template: "appointment_reminder",
        recipientType: "patient",
        recipientId: apt.patient_id,
        data: {
          patientName: `${apt.patients.first_name} ${apt.patients.last_name}`,
          date: dateFormatted,
          time: timeFormatted,
          dentistName: apt.profiles ? `${apt.profiles.first_name} ${apt.profiles.last_name}` : undefined,
          treatment: apt.treatments?.name,
          isToday,
          notes: apt.notes,
        },
      });

      await supabase.from("appointments").update({ reminder_sent: true }).eq("id", apt.id);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Recordatorio enviado");
    } catch (error) {
      toast.error("Error al enviar recordatorio");
    }
  };

  // Fetch real appointments from database
  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ["appointments", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients(first_name, last_name, phone, email),
          treatments(name),
          profiles:dentist_id(first_name, last_name)
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("scheduled_at", { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!profile?.clinic_id,
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show" }) => {
      // If cancelled, delete the appointment instead of updating status
      if (status === "cancelled") {
        const { error } = await supabase
          .from("appointments")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return { deleted: true };
      }
      
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return { deleted: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (result?.deleted) {
        toast.success("Cita cancelada y eliminada");
      } else {
        toast.success("Estado de cita actualizado");
      }
    },
    onError: (error) => {
      toast.error("Error al actualizar: " + error.message);
    },
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

  // Filter appointments for the current selected date
  const getAppointmentsForDate = (date: Date) => {
    return allAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const appointments = getAppointmentsForDate(currentDate);

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      confirmed: "status-confirmed",
      scheduled: "status-scheduled",
      in_progress: "status-in-progress",
      completed: "status-completed",
      cancelled: "status-cancelled",
      no_show: "bg-gray-500 text-white",
    };
    const labels: Record<string, string> = {
      confirmed: t("appointments.confirmed"),
      scheduled: t("appointments.scheduled"),
      in_progress: t("appointments.inProgress"),
      completed: t("appointments.completed"),
      cancelled: t("appointments.cancelled"),
      no_show: "No asistió",
    };
    return (
      <Badge className={`${styles[status || "scheduled"]} border-0 text-xs`}>
        {labels[status || "scheduled"]}
      </Badge>
    );
  };

  const formatDateHeader = () => {
    return currentDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: { date: Date; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: 
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  };

  const getAppointmentPosition = (apt: Appointment) => {
    const scheduledAt = new Date(apt.scheduled_at);
    const startHour = scheduledAt.getHours();
    const startMin = scheduledAt.getMinutes();
    const duration = apt.duration_minutes || 30;

    const startOffset = (startHour - 8) * 80 + (startMin / 60) * 80;
    const height = (duration / 60) * 80;

    return { top: startOffset, height };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "HH:mm");
  };

  const getEndTime = (apt: Appointment) => {
    const date = new Date(apt.scheduled_at);
    date.setMinutes(date.getMinutes() + (apt.duration_minutes || 30));
    return format(date, "HH:mm");
  };

  const handleStatusChange = (id: string, status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show") => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleAppointmentClick = (apt: Appointment) => {
    navigate(`/patients/${apt.patient_id}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("appointments.title")}
            </h1>
            <p className="text-muted-foreground mt-1 capitalize">{formatDateHeader()}</p>
          </div>
          <Button onClick={() => setShowNewAppointment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("appointments.newAppointment")}
          </Button>
        </motion.div>

        {/* New Appointment Modal */}
        <NewAppointmentModal
          open={showNewAppointment}
          onOpenChange={setShowNewAppointment}
        />

        {/* Edit Appointment Modal */}
        <EditAppointmentModal
          open={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
          appointment={editingAppointment}
        />

        {/* Calendar controls */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={goToToday}>
                    {t("appointments.today")}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                  <TabsList>
                    <TabsTrigger value="day">{t("appointments.day")}</TabsTrigger>
                    <TabsTrigger value="week">{t("appointments.week")}</TabsTrigger>
                    <TabsTrigger value="month">{t("appointments.month")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Day view */}
        {!isLoading && view === "day" && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  {/* Time grid */}
                  <div className="space-y-0">
                    {hours.map((hour) => (
                      <div key={hour} className="flex h-20 border-t border-border">
                        <div className="w-16 flex-shrink-0 pr-2 text-right">
                          <span className="text-xs text-muted-foreground">
                            {hour.toString().padStart(2, "0")}:00
                          </span>
                        </div>
                        <div className="flex-1 relative"></div>
                      </div>
                    ))}
                  </div>

                  {/* Appointments overlay */}
                  <div className="absolute top-0 left-16 right-0">
                    {appointments.map((apt) => {
                      const { top, height } = getAppointmentPosition(apt);
                      const patientName = `${apt.patients.first_name} ${apt.patients.last_name}`;
                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute left-2 right-2 p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow bg-primary/10 border-primary"
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 60)}px`,
                            borderLeftWidth: "4px",
                          }}
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          <div className="flex items-start justify-between h-full">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground truncate">
                                  {patientName}
                                </p>
                                {getStatusBadge(apt.status)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {apt.treatments?.name || "Consulta general"}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(apt.scheduled_at)} - {getEndTime(apt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {apt.patients.phone && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 flex-shrink-0"
                                  asChild
                                >
                                  <a href={`tel:${apt.patients.phone}`}>
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAppointment(apt);
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar cita
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleSendReminder(apt)}
                                    disabled={isSendingEmail || !apt.patients.email}
                                  >
                                    <Bell className="mr-2 h-4 w-4" />
                                    Enviar recordatorio
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "confirmed")}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Confirmar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "in_progress")}>
                                    <PlayCircle className="mr-2 h-4 w-4 text-blue-600" />
                                    En progreso
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "completed")}>
                                    <Check className="mr-2 h-4 w-4 text-primary" />
                                    Completada
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "no_show")}>
                                    No asistió
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(apt.id, "cancelled")}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar y eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Empty state */}
                  {appointments.length === 0 && (
                    <div className="absolute inset-0 left-16 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <p>No hay citas para este día</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => setShowNewAppointment(true)}
                        >
                          Agregar cita
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Week view */}
        {!isLoading && view === "week" && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-8 gap-px bg-border min-w-[800px] rounded-lg overflow-hidden">
                    {/* Header row */}
                    <div className="bg-background p-3 font-medium text-sm text-muted-foreground">
                      Hora
                    </div>
                    {getWeekDays().map((day, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setCurrentDate(day);
                          setView("day");
                        }}
                        className={cn(
                          "bg-background p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors",
                          day.toDateString() === new Date().toDateString() && "bg-primary/10"
                        )}
                      >
                        <p className="text-xs text-muted-foreground uppercase">
                          {day.toLocaleDateString("es-ES", { weekday: "short" })}
                        </p>
                        <p className={cn(
                          "font-bold text-lg",
                          day.toDateString() === new Date().toDateString() && "text-primary"
                        )}>
                          {day.getDate()}
                        </p>
                      </div>
                    ))}
                    
                    {/* Time slots */}
                    {hours.map((hour) => (
                      <>
                        <div key={`hour-${hour}`} className="bg-background p-2 text-sm text-muted-foreground border-t border-border">
                          {`${hour.toString().padStart(2, "0")}:00`}
                        </div>
                        {getWeekDays().map((day, dayIndex) => {
                          const dayAppointments = getAppointmentsForDate(day).filter(
                            (apt) => new Date(apt.scheduled_at).getHours() === hour
                          );
                          return (
                            <div
                              key={`${hour}-${dayIndex}`}
                              className="bg-background p-1 min-h-[60px] border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                setCurrentDate(day);
                                setView("day");
                              }}
                            >
                              {dayAppointments.slice(0, 1).map((apt) => (
                                <div
                                  key={apt.id}
                                  className="bg-primary/10 border-l-2 border-primary p-1 rounded text-xs"
                                >
                                  <p className="font-medium truncate">
                                    {apt.patients.first_name} {apt.patients.last_name}
                                  </p>
                                  <p className="text-muted-foreground truncate">
                                    {apt.treatments?.name || "Consulta"}
                                  </p>
                                </div>
                              ))}
                              {dayAppointments.length > 1 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  +{dayAppointments.length - 1} más
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Month view */}
        {!isLoading && view === "month" && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center font-medium text-muted-foreground py-3 text-sm border-b border-border">
                      {day}
                    </div>
                  ))}
                  {generateMonthDays().map((day, i) => {
                    const dayAppointments = getAppointmentsForDate(day.date);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setCurrentDate(day.date);
                          setView("day");
                        }}
                        className={cn(
                          "min-h-24 p-2 border rounded-lg text-sm cursor-pointer transition-colors hover:bg-muted/50",
                          !day.isCurrentMonth && "bg-muted/20 text-muted-foreground",
                          day.isToday && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                          day.isToday && "bg-primary text-primary-foreground"
                        )}>
                          {day.dayNumber}
                        </span>
                        {dayAppointments.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayAppointments.slice(0, 2).map((apt) => (
                              <div 
                                key={apt.id}
                                className="bg-primary/10 border-l-2 border-primary px-1 py-0.5 rounded text-xs truncate"
                              >
                                {apt.patients.first_name}
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{dayAppointments.length - 2} más
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Appointments;