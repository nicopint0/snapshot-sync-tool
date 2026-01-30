import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

const Appointments = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");

  // Mock appointments data
  const appointments = [
    {
      id: "1",
      patientName: "María López",
      phone: "+52 55 1234 5678",
      treatment: "Limpieza dental",
      startTime: "09:00",
      endTime: "09:30",
      status: "confirmed",
      dentist: "Dr. Juan Pérez",
      color: "#0D9488",
    },
    {
      id: "2",
      patientName: "Carlos García",
      phone: "+52 55 9876 5432",
      treatment: "Revisión ortodoncia",
      startTime: "10:00",
      endTime: "10:45",
      status: "scheduled",
      dentist: "Dr. Juan Pérez",
      color: "#0D9488",
    },
    {
      id: "3",
      patientName: "Ana Martínez",
      phone: "+52 55 5555 1234",
      treatment: "Extracción molar",
      startTime: "11:30",
      endTime: "12:30",
      status: "confirmed",
      dentist: "Dr. Juan Pérez",
      color: "#0D9488",
    },
    {
      id: "4",
      patientName: "Roberto Sánchez",
      phone: "+52 55 4321 8765",
      treatment: "Blanqueamiento",
      startTime: "14:00",
      endTime: "15:00",
      status: "in_progress",
      dentist: "Dr. Juan Pérez",
      color: "#0D9488",
    },
    {
      id: "5",
      patientName: "Laura Hernández",
      phone: "+52 55 1111 2222",
      treatment: "Consulta inicial",
      startTime: "16:00",
      endTime: "16:30",
      status: "scheduled",
      dentist: "Dr. Juan Pérez",
      color: "#0D9488",
    },
  ];

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: "status-confirmed",
      scheduled: "status-scheduled",
      in_progress: "status-in-progress",
      completed: "status-completed",
      cancelled: "status-cancelled",
    };
    const labels = {
      confirmed: t("appointments.confirmed"),
      scheduled: t("appointments.scheduled"),
      in_progress: t("appointments.inProgress"),
      completed: t("appointments.completed"),
      cancelled: t("appointments.cancelled"),
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border-0 text-xs`}>
        {labels[status as keyof typeof labels]}
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

  const getAppointmentPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startOffset = (startHour - 8) * 80 + (startMin / 60) * 80;
    const duration = ((endHour - startHour) * 60 + (endMin - startMin)) / 60;
    const height = duration * 80;

    return { top: startOffset, height };
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("appointments.newAppointment")}
          </Button>
        </motion.div>

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

        {/* Day view */}
        {view === "day" && (
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
                    {appointments.map((appointment) => {
                      const { top, height } = getAppointmentPosition(
                        appointment.startTime,
                        appointment.endTime
                      );
                      return (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute left-2 right-2 p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: `${appointment.color}15`,
                            borderColor: appointment.color,
                            borderLeftWidth: "4px",
                          }}
                        >
                          <div className="flex items-start justify-between h-full">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground truncate">
                                  {appointment.patientName}
                                </p>
                                {getStatusBadge(appointment.status)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {appointment.treatment}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {appointment.startTime} - {appointment.endTime}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Week view */}
        {view === "week" && (
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
                          const dayAppointments = appointments.filter(
                            (apt) => parseInt(apt.startTime.split(":")[0]) === hour
                          );
                          return (
                            <div
                              key={`${hour}-${dayIndex}`}
                              className="bg-background p-1 min-h-[60px] border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              {dayIndex === 0 && dayAppointments.slice(0, 1).map((apt) => (
                                <div
                                  key={apt.id}
                                  className="bg-primary/10 border-l-2 border-primary p-1 rounded text-xs"
                                >
                                  <p className="font-medium truncate">{apt.patientName}</p>
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
          </motion.div>
        )}

        {/* Month view */}
        {view === "month" && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center font-medium text-muted-foreground py-3 text-sm border-b border-border">
                      {day}
                    </div>
                  ))}
                  {generateMonthDays().map((day, i) => (
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
                      {/* Show appointments for first few days as demo */}
                      {day.isCurrentMonth && day.dayNumber <= 5 && (
                        <div className="mt-1 space-y-1">
                          <div className="bg-primary/10 border-l-2 border-primary px-1 py-0.5 rounded text-xs truncate">
                            {appointments[day.dayNumber - 1]?.patientName || "Cita"}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
