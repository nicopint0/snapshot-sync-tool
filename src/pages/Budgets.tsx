import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Eye, Edit, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/layout/AppLayout";
import NewBudgetDialog from "@/components/budgets/NewBudgetDialog";
import { supabase } from "@/integrations/supabase/client";

interface Budget {
  id: string;
  patient_id: string;
  status: string | null;
  total: number | null;
  valid_until: string | null;
  created_at: string;
  patients?: {
    first_name: string;
    last_name: string;
  };
}

const Budgets = () => {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewBudget, setShowNewBudget] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          patients (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    { value: "all", label: "Todos los estados" },
    { value: "draft", label: "Borrador" },
    { value: "sent", label: "Enviado" },
    { value: "approved", label: "Aprobado" },
    { value: "rejected", label: "Rechazado" },
    { value: "expired", label: "Vencido" },
  ];

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      expired: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    };
    const labels: Record<string, string> = {
      draft: "Borrador",
      sent: "Enviado",
      approved: "Aprobado",
      rejected: "Rechazado",
      expired: "Vencido",
    };
    const s = status || "draft";
    return (
      <Badge className={`${styles[s]} border-0`}>
        {labels[s]}
      </Badge>
    );
  };

  const filteredBudgets = budgets.filter(b => {
    const patientName = `${b.patients?.first_name || ""} ${b.patients?.last_name || ""}`.toLowerCase();
    const matchesSearch = patientName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-2xl font-bold text-foreground">{t("budgets.title")}</h1>
            <p className="text-muted-foreground">Gestión de presupuestos de tratamientos</p>
          </div>
          <Button onClick={() => setShowNewBudget(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        </div>

        <NewBudgetDialog
          open={showNewBudget}
          onOpenChange={setShowNewBudget}
        />
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Budgets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {filteredBudgets.length} Presupuestos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron presupuestos</p>
                <Button className="mt-4" onClick={() => setShowNewBudget(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer presupuesto
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Presupuesto</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Válido hasta</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-mono">
                        #{budget.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {budget.patients?.first_name} {budget.patients?.last_name}
                      </TableCell>
                      <TableCell>
                        {new Date(budget.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        {budget.valid_until
                          ? new Date(budget.valid_until).toLocaleDateString("es-ES")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${(budget.total || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(budget.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default Budgets;