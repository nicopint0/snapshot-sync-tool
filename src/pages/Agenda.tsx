import { useState } from "react";
import { useTranslation } from "react-i18next";
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

type ViewType = "day" | "week" | "month";

const Agenda = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [selectedDentist, setSelectedDentist] = useState<string>("all");

  // Mock data for appointments
  const appointments = [
    {
      id: "1",
      patientName: "María López",
      time: "09:00",
      duration: 60,
      treatment: "Limpieza dental",
      status: "confirmed",
      dentist: "Dr. Juan Pérez",
    },
    {
      id: "2",
      patientName: "Carlos García",
      time: "10:30",
      duration: 45,
      treatment: "Revisión ortodoncia",
      status: "scheduled",
      dentist: "Dr. Juan Pérez",
    },
    {
      id: "3",
      patientName: "Ana Martínez",
      time: "14:00",
      duration: 90,
      treatment: "Extracción molar",
      status: "confirmed",
      dentist: "Dra. Laura Sánchez",
    },
    {
      id: "4",
      patientName: "Roberto Sánchez",
      time: "16:00",
      duration: 60,
      treatment: "Blanqueamiento",
      status: "scheduled",
      dentist: "Dr. Juan Pérez",
    },
  ];

  const dentists = [
    { id: "all", name: "Todos los dentistas" },
    { id: "1", name: "Dr. Juan Pérez" },
    { id: "2", name: "Dra. Laura Sánchez" },
  ];

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    const labels: Record<string, string> = {
      confirmed: "Confirmada",
      scheduled: "Programada",
      cancelled: "Cancelada",
    };
    return (
      <Badge className={`${styles[status]} border-0`}>
        {labels[status]}
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
            <Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mini Calendar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {view === "day" && "Vista Diaria"}
                {view === "week" && "Vista Semanal"}
                {view === "month" && "Vista Mensual"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {view === "month" ? (
                <div className="text-center py-8 text-muted-foreground">
                  Vista mensual - Próximamente
                </div>
              ) : view === "week" ? (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-8 gap-px bg-border min-w-[800px]">
                    {/* Header row */}
                    <div className="bg-background p-2 font-medium text-sm text-muted-foreground">
                      Hora
                    </div>
                    {getWeekDays().map((day, i) => (
                      <div
                        key={i}
                        className={`bg-background p-2 text-center ${
                          day.toDateString() === new Date().toDateString()
                            ? "bg-primary/10"
                            : ""
                        }`}
                      >
                        <p className="text-xs text-muted-foreground">
                          {day.toLocaleDateString("es-ES", { weekday: "short" })}
                        </p>
                        <p className="font-bold text-lg">{day.getDate()}</p>
                      </div>
                    ))}
                    
                    {/* Time slots */}
                    {hours.map((hour) => (
                      <>
                        <div key={`hour-${hour}`} className="bg-background p-2 text-sm text-muted-foreground border-t border-border">
                          {`${hour.toString().padStart(2, "0")}:00`}
                        </div>
                        {getWeekDays().map((day, dayIndex) => (
                          <div
                            key={`${hour}-${dayIndex}`}
                            className="bg-background p-1 min-h-[60px] border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            {/* Show appointments for this time slot */}
                            {appointments
                              .filter((apt) => parseInt(apt.time.split(":")[0]) === hour)
                              .slice(0, 1)
                              .map((apt) => (
                                <div
                                  key={apt.id}
                                  className="bg-primary/10 border-l-2 border-primary p-1 rounded text-xs"
                                >
                                  <p className="font-medium truncate">{apt.patientName}</p>
                                  <p className="text-muted-foreground truncate">{apt.treatment}</p>
                                </div>
                              ))}
                          </div>
                        ))}
                      </>
                    ))}
                  </div>
                </div>
              ) : (
                /* Day View */
                <div className="space-y-2">
                  {hours.map((hour) => (
                    <div key={hour} className="flex gap-4 py-3 border-b border-border last:border-0">
                      <div className="w-16 text-sm text-muted-foreground shrink-0">
                        {`${hour.toString().padStart(2, "0")}:00`}
                      </div>
                      <div className="flex-1 min-h-[40px]">
                        {appointments
                          .filter((apt) => parseInt(apt.time.split(":")[0]) === hour)
                          .map((apt) => (
                            <div
                              key={apt.id}
                              className="p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {apt.time} - {apt.duration}min
                                  </div>
                                  <span className="font-medium">{apt.patientName}</span>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citas del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold">{apt.time}</p>
                      <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.treatment} • {apt.dentist}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default Agenda;