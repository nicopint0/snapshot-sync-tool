import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import AppLayout from "@/components/layout/AppLayout";
import NewAppointmentModal from "@/components/appointments/NewAppointmentModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type ViewType = "day" | "week" | "month";

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  time: string;
  duration: number;
  treatment: string;
  status: string;
  dentist: string;
  scheduled_at: string;
}

const Agenda = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [selectedDentist, setSelectedDentist] = useState<string>("all");
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  // Calculate date range based on view
  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    
    if (view === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === "week") {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // month view
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  };

  // Fetch appointments from database
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", selectedDate.toISOString().split("T")[0], view],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          patient_id,
          scheduled_at,
          duration_minutes,
          status,
          notes,
          patients!inner(first_name, last_name),
          treatments(name),
          profiles!appointments_dentist_id_fkey(first_name, last_name)
        `)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((apt: any) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
        time: new Date(apt.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        duration: apt.duration_minutes || 30,
        treatment: apt.treatments?.name || "Consulta general",
        status: apt.status || "scheduled",
        dentist: apt.profiles ? `Dr. ${apt.profiles.first_name} ${apt.profiles.last_name}` : "Sin asignar",
        scheduled_at: apt.scheduled_at,
      })) as Appointment[];
    },
  });

  // Fetch dentists
  const { data: dentists = [] } = useQuery({
    queryKey: ["dentists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");
      if (error) throw error;
      return [
        { id: "all", name: "Todos los dentistas" },
        ...(data || []).map((d: any) => ({
          id: d.id,
          name: `Dr. ${d.first_name} ${d.last_name}`,
        })),
      ];
    },
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      completed: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
      in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    };
    const labels: Record<string, string> = {
      confirmed: "Confirmada",
      scheduled: "Programada",
      cancelled: "Cancelada",
      completed: "Completada",
      in_progress: "En progreso",
    };
    return (
      <Badge className={`${styles[status] || styles.scheduled} border-0`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    const offset = direction === "next" ? 1 : -1;
    
    if (view === "day") {
      newDate.setDate(newDate.getDate() + offset);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (offset * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + offset);
    }
    
    setSelectedDate(newDate);
  };

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  // Filter appointments for selected date (day view)
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  // Get appointments for a specific hour on a specific day
  // Shows appointments that START within this hour block (e.g., 10:00-10:59)
  const getAppointmentsForHour = (date: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      return aptDate.toDateString() === date.toDateString() && aptDate.getHours() === hour;
    });
  };

  // Navigate to patient detail
  const handleAppointmentClick = (appointment: Appointment) => {
    navigate(`/patients/${appointment.patient_id}`);
  };

  // Generate month days for calendar view
  const generateMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: { date: Date; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Current month days
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
    
    // Next month days
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

  const todayAppointments = getAppointmentsForDate(selectedDate);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground capitalize">{formatDate(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedDentist} onValueChange={setSelectedDentist}>
              <SelectTrigger className="w-48">
                <User className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowNewAppointment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Navigation and View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("day")}
            >
              Día
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-x border-border"
              onClick={() => setView("week")}
            >
              Semana
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("month")}
            >
              Mes
            </Button>
          </div>
        </div>

        {/* Day View - Shows mini calendar + schedule */}
        {view === "day" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Mini Calendar */}
            <Card className="lg:col-span-1">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* Day Schedule */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Vista Diaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hours.map((hour) => {
                    const hourAppointments = getAppointmentsForHour(selectedDate, hour);
                    return (
                      <div key={hour} className="flex gap-4 py-3 border-b border-border last:border-0">
                        <div className="w-16 text-sm text-muted-foreground shrink-0">
                          {`${hour.toString().padStart(2, "0")}:00`}
                        </div>
                        <div className="flex-1 min-h-[40px] space-y-2">
                          {hourAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => handleAppointmentClick(apt)}
                              className="p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {apt.time} - {apt.duration}min
                                  </div>
                                  <span className="font-medium">{apt.patient_name}</span>
                                </div>
                                {getStatusBadge(apt.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {apt.treatment} • {apt.dentist}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Week View - Full width calendar grid */}
        {view === "week" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Vista Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-px bg-border min-w-[800px]">
                  {/* Header row */}
                  <div className="bg-background p-2 font-medium text-sm text-muted-foreground">
                    Hora
                  </div>
                  {getWeekDays().map((day, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedDate(day);
                        setView("day");
                      }}
                      className={cn(
                        "bg-background p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors",
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
                        const dayAppointments = getAppointmentsForHour(day, hour);
                        return (
                          <div
                            key={`${hour}-${dayIndex}`}
                            className="bg-background p-1 min-h-[60px] border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            {dayAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                onClick={() => handleAppointmentClick(apt)}
                                className="bg-primary/10 border-l-2 border-primary p-1 rounded text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                              >
                                <p className="font-medium truncate">{apt.patient_name}</p>
                                <p className="text-muted-foreground truncate">{apt.treatment}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Month View - Full width calendar grid */}
        {view === "month" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Vista Mensual - {selectedDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        setSelectedDate(day.date);
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
                      {/* Show appointments for this day */}
                      {day.isCurrentMonth && dayAppointments.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => (
                            <div
                              key={apt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick(apt);
                              }}
                              className="bg-primary/10 border-l-2 border-primary px-1 py-0.5 rounded text-xs truncate cursor-pointer hover:bg-primary/20"
                            >
                              {apt.patient_name}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <p className="text-xs text-muted-foreground px-1">
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
        )}

        {/* Today's Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Citas del {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay citas para este día</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => handleAppointmentClick(apt)}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold">{apt.time}</p>
                        <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {apt.treatment} • {apt.dentist}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <NewAppointmentModal
          open={showNewAppointment}
          onOpenChange={setShowNewAppointment}
        />
      </motion.div>
    </AppLayout>
  );
};

export default Agenda;
