import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Search } from "lucide-react";
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
  DialogTrigger,
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface Budget {
  id: string;
  total: number | null;
  status: string | null;
  created_at: string;
}

interface PaymentData {
  patient_id: string;
  budget_id: string | null;
  amount: string;
  payment_method: string;
  notes: string;
}

const RegisterPaymentDialog = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [payment, setPayment] = useState<PaymentData>({
    patient_id: "",
    budget_id: null,
    amount: "",
    payment_method: "cash",
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

  // Fetch patient budgets
  const { data: budgets = [] } = useQuery({
    queryKey: ["patient-budgets", payment.patient_id],
    queryFn: async () => {
      if (!payment.patient_id) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select("id, total, status, created_at")
        .eq("patient_id", payment.patient_id)
        .in("status", ["approved", "pending", "partial"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!payment.patient_id,
  });

  // Register payment mutation
  const registerPaymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      if (!profile?.clinic_id) throw new Error("No clinic found");
      
      const { error } = await supabase.from("payments").insert({
        clinic_id: profile.clinic_id,
        patient_id: data.patient_id,
        budget_id: data.budget_id || null,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        notes: data.notes || null,
        payment_date: new Date().toISOString(),
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Pago registrado exitosamente");
      handleClose();
    },
    onError: (error) => {
      toast.error("Error al registrar pago: " + error.message);
    },
  });

  const handleClose = () => {
    setOpen(false);
    setSelectedPatient(null);
    setPayment({
      patient_id: "",
      budget_id: null,
      amount: "",
      payment_method: "cash",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payment.patient_id) {
      toast.error("Selecciona un paciente");
      return;
    }
    
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    
    registerPaymentMutation.mutate(payment);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPayment((prev) => ({ ...prev, patient_id: patient.id, budget_id: null }));
    setPatientOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra un nuevo pago de un paciente
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

          {/* Budget selector (optional) */}
          {payment.patient_id && budgets.length > 0 && (
            <div className="space-y-2">
              <Label>Presupuesto asociado</Label>
              <Select
                value={payment.budget_id || "none"}
                onValueChange={(v) =>
                  setPayment({ ...payment, budget_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar presupuesto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin presupuesto asociado</SelectItem>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {new Date(budget.created_at).toLocaleDateString("es-ES")} -{" "}
                      ${budget.total?.toFixed(2) || "0.00"} ({budget.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                className="pl-7"
                placeholder="0.00"
                value={payment.amount}
                onChange={(e) =>
                  setPayment({ ...payment, amount: e.target.value })
                }
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Método de pago *</Label>
            <Select
              value={payment.payment_method}
              onValueChange={(v) =>
                setPayment({ ...payment, payment_method: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Efectivo</SelectItem>
                <SelectItem value="card">💳 Tarjeta</SelectItem>
                <SelectItem value="transfer">🏦 Transferencia</SelectItem>
                <SelectItem value="other">📝 Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Referencia / Notas</Label>
            <Textarea
              placeholder="Número de transacción, notas adicionales..."
              value={payment.notes}
              onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registerPaymentMutation.isPending}
            >
              {registerPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterPaymentDialog;
