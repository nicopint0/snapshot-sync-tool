import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, format, eachMonthOfInterval, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";

type DateRange = "week" | "month" | "quarter" | "year";

const Reports = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("month");

  // Calculate date range based on selection
  const { startDate, endDate, previousStartDate, previousEndDate } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    switch (dateRange) {
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        prevStart = startOfWeek(subMonths(now, 0), { weekStartsOn: 1 });
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd = new Date(prevStart);
        prevEnd.setDate(prevEnd.getDate() + 6);
        break;
      case "quarter":
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        prevStart = startOfQuarter(subMonths(now, 3));
        prevEnd = endOfQuarter(subMonths(now, 3));
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        prevStart = startOfYear(subMonths(now, 12));
        prevEnd = endOfYear(subMonths(now, 12));
        break;
      case "month":
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        prevStart = startOfMonth(subMonths(now, 1));
        prevEnd = endOfMonth(subMonths(now, 1));
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      previousStartDate: prevStart.toISOString(),
      previousEndDate: prevEnd.toISOString(),
    };
  }, [dateRange]);

  // Fetch patients count
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["reports-patients", profile?.clinic_id, startDate, endDate],
    queryFn: async () => {
      if (!profile?.clinic_id) return { total: 0, previous: 0 };
      
      const [currentRes, previousRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .lte("created_at", endDate),
        supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .lte("created_at", previousEndDate),
      ]);

      return {
        total: currentRes.count || 0,
        previous: previousRes.count || 0,
      };
    },
    enabled: !!profile?.clinic_id,
  });

  // Fetch appointments
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ["reports-appointments", profile?.clinic_id, startDate, endDate],
    queryFn: async () => {
      if (!profile?.clinic_id) return { current: [], previous: [], total: 0, previousTotal: 0, noShowCount: 0, previousNoShowCount: 0 };
      
      const [currentRes, previousRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .gte("scheduled_at", startDate)
          .lte("scheduled_at", endDate),
        supabase
          .from("appointments")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .gte("scheduled_at", previousStartDate)
          .lte("scheduled_at", previousEndDate),
      ]);

      const current = currentRes.data || [];
      const previous = previousRes.data || [];

      return {
        current,
        previous,
        total: current.length,
        previousTotal: previous.length,
        noShowCount: current.filter(a => a.status === "no_show").length,
        previousNoShowCount: previous.filter(a => a.status === "no_show").length,
      };
    },
    enabled: !!profile?.clinic_id,
  });

  // Fetch payments
  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["reports-payments", profile?.clinic_id, startDate, endDate],
    queryFn: async () => {
      if (!profile?.clinic_id) return { current: [], previous: [], total: 0, previousTotal: 0 };
      
      const [currentRes, previousRes] = await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .gte("payment_date", startDate)
          .lte("payment_date", endDate),
        supabase
          .from("payments")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .gte("payment_date", previousStartDate)
          .lte("payment_date", previousEndDate),
      ]);

      const current = currentRes.data || [];
      const previous = previousRes.data || [];

      return {
        current,
        previous,
        total: current.reduce((sum, p) => sum + p.amount, 0),
        previousTotal: previous.reduce((sum, p) => sum + p.amount, 0),
      };
    },
    enabled: !!profile?.clinic_id,
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const patientsChange = patientsData?.previous 
      ? ((patientsData.total - patientsData.previous) / patientsData.previous) * 100 
      : 0;

    const appointmentsChange = appointmentsData?.previousTotal 
      ? ((appointmentsData.total - appointmentsData.previousTotal) / appointmentsData.previousTotal) * 100 
      : 0;

    const paymentsChange = paymentsData?.previousTotal 
      ? ((paymentsData.total - paymentsData.previousTotal) / paymentsData.previousTotal) * 100 
      : 0;

    const noShowRate = appointmentsData?.total 
      ? (appointmentsData.noShowCount / appointmentsData.total) * 100 
      : 0;
    const prevNoShowRate = appointmentsData?.previousTotal 
      ? (appointmentsData.previousNoShowCount / appointmentsData.previousTotal) * 100 
      : 0;
    const noShowChange = prevNoShowRate ? noShowRate - prevNoShowRate : 0;

    return [
      {
        title: "Pacientes Totales",
        value: patientsData?.total?.toLocaleString() || "0",
        change: Math.round(patientsChange),
        positive: patientsChange >= 0,
        icon: Users,
      },
      {
        title: "Citas del Período",
        value: appointmentsData?.total?.toString() || "0",
        change: Math.round(appointmentsChange),
        positive: appointmentsChange >= 0,
        icon: Calendar,
      },
      {
        title: "Ingresos del Período",
        value: `$${(paymentsData?.total || 0).toLocaleString()}`,
        change: Math.round(paymentsChange),
        positive: paymentsChange >= 0,
        icon: DollarSign,
      },
      {
        title: "Tasa de Ausentismo",
        value: `${noShowRate.toFixed(1)}%`,
        change: Math.round(noShowChange * 10) / 10,
        positive: noShowChange <= 0,
        icon: Clock,
      },
    ];
  }, [patientsData, appointmentsData, paymentsData]);

  // Revenue chart data
  const revenueChartData = useMemo(() => {
    if (!paymentsData?.current?.length) return [];

    const now = new Date();
    let intervals: Date[];
    let formatStr: string;

    if (dateRange === "week") {
      intervals = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
      formatStr = "EEE";
    } else if (dateRange === "year") {
      intervals = eachMonthOfInterval({ start: new Date(startDate), end: new Date(endDate) });
      formatStr = "MMM";
    } else {
      intervals = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
      formatStr = "d MMM";
    }

    return intervals.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      if (dateRange === "year") {
        dayEnd.setMonth(dayEnd.getMonth() + 1);
        dayEnd.setDate(0);
      }
      dayEnd.setHours(23, 59, 59, 999);

      const revenue = paymentsData.current
        .filter(p => {
          const paymentDate = new Date(p.payment_date || p.created_at);
          return paymentDate >= dayStart && paymentDate <= dayEnd;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        label: format(date, formatStr, { locale: es }),
        revenue,
      };
    });
  }, [paymentsData, dateRange, startDate, endDate]);

  // Appointments by day of week
  const appointmentsByDayData = useMemo(() => {
    if (!appointmentsData?.current?.length) {
      return [
        { day: "Lun", citas: 0 },
        { day: "Mar", citas: 0 },
        { day: "Mié", citas: 0 },
        { day: "Jue", citas: 0 },
        { day: "Vie", citas: 0 },
        { day: "Sáb", citas: 0 },
        { day: "Dom", citas: 0 },
      ];
    }

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    appointmentsData.current.forEach(apt => {
      const dayIndex = getDay(new Date(apt.scheduled_at));
      counts[dayIndex]++;
    });

    // Reorder to start from Monday
    return [
      { day: "Lun", citas: counts[1] },
      { day: "Mar", citas: counts[2] },
      { day: "Mié", citas: counts[3] },
      { day: "Jue", citas: counts[4] },
      { day: "Vie", citas: counts[5] },
      { day: "Sáb", citas: counts[6] },
      { day: "Dom", citas: counts[0] },
    ];
  }, [appointmentsData]);

  // Payment methods distribution
  const paymentMethodsData = useMemo(() => {
    if (!paymentsData?.current?.length) return [];

    const methods: Record<string, number> = {};
    const total = paymentsData.current.reduce((sum, p) => sum + p.amount, 0);

    paymentsData.current.forEach(p => {
      const method = p.payment_method || "other";
      methods[method] = (methods[method] || 0) + p.amount;
    });

    const colors: Record<string, string> = {
      cash: "#10B981",
      card: "#3B82F6",
      transfer: "#8B5CF6",
      other: "#F59E0B",
    };

    const labels: Record<string, string> = {
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
      other: "Otro",
    };

    return Object.entries(methods).map(([method, amount]) => ({
      name: labels[method] || method,
      value: Math.round((amount / total) * 100),
      color: colors[method] || "#6B7280",
    }));
  }, [paymentsData]);

  const isLoading = loadingPatients || loadingAppointments || loadingPayments;

  const getPeriodLabel = () => {
    switch (dateRange) {
      case "week": return "vs semana anterior";
      case "month": return "vs mes anterior";
      case "quarter": return "vs trimestre anterior";
      case "year": return "vs año anterior";
      default: return "vs período anterior";
    }
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
            <h1 className="text-2xl font-bold text-foreground">{t("reports.title")}</h1>
            <p className="text-muted-foreground">Análisis y métricas de tu clínica</p>
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                        <p className="text-2xl font-bold">{kpi.value}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {kpi.positive ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${kpi.positive ? "text-green-500" : "text-red-500"}`}>
                            {kpi.change > 0 ? "+" : ""}{kpi.change}%
                          </span>
                          <span className="text-sm text-muted-foreground">{getPeriodLabel()}</span>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <kpi.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ingresos del Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {revenueChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="label" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                          <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Ingresos"]}
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No hay datos de ingresos para este período
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Appointments Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Citas por Día de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={appointmentsByDayData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [value, "Citas"]}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="citas"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribución por Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center">
                    {paymentMethodsData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentMethodsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {paymentMethodsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value}%`, "Porcentaje"]}
                              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                          {paymentMethodsData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm">{item.name}</span>
                              <span className="text-sm text-muted-foreground ml-auto">{item.value}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="w-full text-center text-muted-foreground">
                        No hay datos de pagos para este período
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen del Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Total de citas</span>
                      <span className="font-bold">{appointmentsData?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Citas completadas</span>
                      <span className="font-bold text-green-600">
                        {appointmentsData?.current?.filter(a => a.status === "completed").length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Citas canceladas/ausentes</span>
                      <span className="font-bold text-red-600">
                        {appointmentsData?.current?.filter(a => a.status === "cancelled" || a.status === "no_show").length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Ingresos totales</span>
                      <span className="font-bold text-primary">
                        ${(paymentsData?.total || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Pagos registrados</span>
                      <span className="font-bold">{paymentsData?.current?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Reports;
