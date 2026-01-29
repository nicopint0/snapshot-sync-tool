import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  UserPlus,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  
  // Get user display name from profile
  const displayName = profile 
    ? `${profile.first_name} ${profile.last_name}`.trim() || "Usuario"
    : "Usuario";

  // Mock data
  const todayStats = {
    totalAppointments: 8,
    completed: 3,
    pending: 5,
    expectedRevenue: 12500,
    confirmedCount: 6,
    unconfirmedCount: 2,
  };

  const monthlyStats = [
    {
      title: t("dashboard.newPatients"),
      value: "23",
      change: 12,
      icon: Users,
      positive: true,
    },
    {
      title: t("appointments.title"),
      value: "156",
      change: 8,
      icon: Calendar,
      positive: true,
    },
    {
      title: t("dashboard.monthlyRevenue"),
      value: "$45,200",
      change: 15,
      icon: DollarSign,
      positive: true,
    },
    {
      title: t("dashboard.noShowRate"),
      value: "4.2%",
      change: -2,
      icon: Clock,
      positive: true,
    },
  ];

  const upcomingAppointments = [
    {
      id: "1",
      patientName: "María López",
      time: "10:00 AM",
      treatment: "Limpieza dental",
      status: "confirmed",
    },
    {
      id: "2",
      patientName: "Carlos García",
      time: "11:30 AM",
      treatment: "Revisión ortodoncia",
      status: "scheduled",
    },
    {
      id: "3",
      patientName: "Ana Martínez",
      time: "2:00 PM",
      treatment: "Extracción molar",
      status: "confirmed",
    },
    {
      id: "4",
      patientName: "Roberto Sánchez",
      time: "3:30 PM",
      treatment: "Blanqueamiento",
      status: "scheduled",
    },
  ];

  const recentPatients = [
    { id: "1", name: "María López", date: "Hoy" },
    { id: "2", name: "Carlos García", date: "Ayer" },
    { id: "3", name: "Ana Martínez", date: "Hace 2 días" },
    { id: "4", name: "Roberto Sánchez", date: "Hace 3 días" },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: "status-confirmed",
      scheduled: "status-scheduled",
      in_progress: "status-in-progress",
    };
    const labels = {
      confirmed: t("appointments.confirmed"),
      scheduled: t("appointments.scheduled"),
      in_progress: t("appointments.inProgress"),
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border-0`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
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
        {/* Welcome header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("dashboard.welcome")}, {displayName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/patients/new">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("dashboard.newPatient")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/appointments/new">
                <Plus className="h-4 w-4 mr-2" />
                {t("dashboard.newAppointment")}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Monthly stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {monthlyStats.map((stat, index) => (
            <Card key={index} className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.positive ? (
                        <TrendingUp className="h-4 w-4 text-status-confirmed" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stat.positive ? "text-status-confirmed" : "text-destructive"
                        }`}
                      >
                        {stat.change > 0 ? "+" : ""}
                        {stat.change}%
                      </span>
                      <span className="text-sm text-muted-foreground">vs mes anterior</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Today's summary and upcoming appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's summary */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("dashboard.todaySummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {todayStats.totalAppointments}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("dashboard.appointments")}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-primary/40" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xl font-bold text-status-confirmed">
                      {todayStats.completed}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.completed")}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xl font-bold text-status-scheduled">
                      {todayStats.pending}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.pending")}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-sm text-secondary-foreground mb-1">
                    {t("dashboard.expectedRevenue")}
                  </p>
                  <p className="text-2xl font-bold text-secondary-foreground">
                    ${todayStats.expectedRevenue.toLocaleString()}
                  </p>
                </div>

                <Button className="w-full" variant="outline" asChild>
                  <Link to="/appointments">
                    {t("dashboard.viewAgenda")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming appointments */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t("dashboard.upcomingAppointments")}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/appointments">
                    {t("common.viewAll")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-foreground">
                            {appointment.time.split(" ")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.time.split(" ")[1]}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-border" />
                        <div>
                          <p className="font-medium text-foreground">
                            {appointment.patientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.treatment}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(appointment.status)}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent patients */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t("dashboard.recentPatients")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patients">
                  {t("common.viewAll")}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Dashboard;
