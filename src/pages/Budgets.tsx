import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Eye, Loader2, FileText, CheckCircle, XCircle, Send, MoreHorizontal, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/components/layout/AppLayout";
import NewBudgetDialog from "@/components/budgets/NewBudgetDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Budget {
  id: string;
  patient_id: string;
  status: string | null;
  total: number | null;
  subtotal: number | null;
  discount_percent: number | null;
  tax_percent: number | null;
  valid_until: string | null;
  created_at: string;
  notes: string | null;
  patients?: {
    first_name: string;
    last_name: string;
    whatsapp: string | null;
    phone: string | null;
  };
  budget_items?: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

const Budgets = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: budgets = [], isLoading: loading } = useQuery({
    queryKey: ["budgets", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          patients (
            first_name,
            last_name,
            whatsapp,
            phone
          ),
          budget_items (
            id,
            description,
            quantity,
            unit_price,
            total
          )
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!profile?.clinic_id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ budgetId, status }: { budgetId: string; status: string }) => {
      const { error } = await supabase
        .from("budgets")
        .update({ status })
        .eq("id", budgetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Estado actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar: " + error.message);
    },
  });

  const handleViewBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDetailDialog(true);
  };

  const handleChangeStatus = (budgetId: string, status: string) => {
    updateStatusMutation.mutate({ budgetId, status });
  };

  const handleSendWhatsApp = (budget: Budget) => {
    const phone = budget.patients?.whatsapp || budget.patients?.phone;
    if (!phone) {
      toast.error("El paciente no tiene número de WhatsApp registrado");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const patientName = `${budget.patients?.first_name || ""} ${budget.patients?.last_name || ""}`.trim();
    const budgetNumber = budget.id.slice(0, 8).toUpperCase();
    const date = new Date(budget.created_at).toLocaleDateString("es-ES");
    
    // Build items list
    const itemsList = budget.budget_items?.map(item => 
      `• ${item.description}: $${(item.total || 0).toLocaleString()}`
    ).join("\n") || "";

    const message = `¡Hola ${patientName}! 👋

Le enviamos el presupuesto *#${budgetNumber}* de su tratamiento dental:

📋 *Detalle:*
${itemsList}

💰 *Total: $${(budget.total || 0).toLocaleString()}*

📅 Fecha: ${date}
${budget.valid_until ? `⏳ Válido hasta: ${new Date(budget.valid_until).toLocaleDateString("es-ES")}` : ""}

¿Tiene alguna pregunta? Estamos a su disposición.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    
    // Mark as sent
    handleChangeStatus(budget.id, "sent");
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
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewBudget(budget)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleSendWhatsApp(budget)}
                            title="Enviar por WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSendWhatsApp(budget)}>
                                <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                                Enviar por WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleChangeStatus(budget.id, "sent")}>
                                <Send className="mr-2 h-4 w-4" />
                                Marcar como Enviado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(budget.id, "approved")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Aprobado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(budget.id, "rejected")}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Marcar como Rechazado
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleChangeStatus(budget.id, "draft")}>
                                Volver a Borrador
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Budget Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Presupuesto #{selectedBudget?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedBudget && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">
                    {selectedBudget.patients?.first_name} {selectedBudget.patients?.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {new Date(selectedBudget.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="border rounded-lg divide-y">
                {selectedBudget.budget_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ${(item.unit_price || 0).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold">${(item.total || 0).toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-muted">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">
                    ${(selectedBudget.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedBudget.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{selectedBudget.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {getStatusBadge(selectedBudget.status)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Budgets;
