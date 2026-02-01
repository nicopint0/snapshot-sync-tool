import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Plus, Trash2, CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

interface Treatment {
  id: string;
  name: string;
  price: number;
}

interface BudgetItem {
  treatment_id: string | null;
  treatment_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  isCustom?: boolean;
}

interface NewBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatient?: Patient | null;
}

const NewBudgetDialog = ({ open, onOpenChange, preselectedPatient }: NewBudgetDialogProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatient || null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState<Date | undefined>(addDays(new Date(), 30));
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");

  // Update selected patient when preselectedPatient changes or dialog opens
  useEffect(() => {
    if (open && preselectedPatient) {
      setSelectedPatient(preselectedPatient);
    }
  }, [open, preselectedPatient]);

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

  // Fetch treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ["treatments", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      const { data, error } = await supabase
        .from("treatments")
        .select("id, name, price")
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Treatment[];
    },
    enabled: !!profile?.clinic_id && open,
  });

  // Create budget mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinic_id) throw new Error("No clinic found");
      if (!selectedPatient) throw new Error("No patient selected");
      if (items.length === 0) throw new Error("No items in budget");
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      
      // Create budget
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          clinic_id: profile.clinic_id,
          patient_id: selectedPatient.id,
          created_by: profile.id,
          subtotal,
          total: subtotal,
          status: "draft",
          notes: notes || null,
          valid_until: validUntil ? format(validUntil, "yyyy-MM-dd") : null,
        })
        .select()
        .single();
      
      if (budgetError) throw budgetError;
      
      // Create budget items
      const budgetItems = items.map((item) => ({
        budget_id: budget.id,
        treatment_id: item.isCustom ? null : item.treatment_id,
        description: item.treatment_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));
      
      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(budgetItems);
      
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Presupuesto creado exitosamente");
      handleClose();
    },
    onError: (error) => {
      toast.error("Error al crear presupuesto: " + error.message);
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setSelectedPatient(null);
    setItems([]);
    setNotes("");
    setValidUntil(addDays(new Date(), 30));
    setSelectedTreatment("");
    setCustomItemName("");
    setCustomItemPrice("");
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientOpen(false);
  };

  const handleAddItem = () => {
    if (!selectedTreatment) return;
    
    const treatment = treatments.find(t => t.id === selectedTreatment);
    if (!treatment) return;
    
    // Check if already exists
    if (items.some(item => item.treatment_id === treatment.id)) {
      toast.error("Este tratamiento ya está en el presupuesto");
      return;
    }
    
    setItems([
      ...items,
      {
        treatment_id: treatment.id,
        treatment_name: treatment.name,
        quantity: 1,
        unit_price: treatment.price,
        total: treatment.price,
      },
    ]);
    setSelectedTreatment("");
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) {
      toast.error("Ingresa nombre y precio del item");
      return;
    }
    
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    
    setItems([
      ...items,
      {
        treatment_id: null,
        treatment_name: customItemName.trim(),
        quantity: 1,
        unit_price: price,
        total: price,
        isCustom: true,
      },
    ]);
    setCustomItemName("");
    setCustomItemPrice("");
  };

  const handleUpdatePrice = (index: number, price: number) => {
    if (price < 0) return;
    const newItems = [...items];
    newItems[index].unit_price = price;
    newItems[index].total = newItems[index].quantity * price;
    setItems(newItems);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].total = quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error("Selecciona un paciente");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Agrega al menos un tratamiento");
      return;
    }
    
    createMutation.mutate();
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Presupuesto</DialogTitle>
          <DialogDescription>
            Crea un nuevo presupuesto para un paciente
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

          {/* Add treatment */}
          <div className="space-y-2">
            <Label>Agregar Tratamiento</Label>
            <div className="flex gap-2">
              <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar tratamiento..." />
                </SelectTrigger>
                <SelectContent>
                {treatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id}>
                      {treatment.name} - ${(treatment.price ?? 0).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddItem} disabled={!selectedTreatment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Add custom item */}
          <div className="space-y-2">
            <Label>Agregar Item Personalizado</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Descripción..."
                className="flex-1"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
              />
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio"
                  className="pl-7"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                />
              </div>
              <Button type="button" onClick={handleAddCustomItem} disabled={!customItemName.trim() || !customItemPrice}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>


          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Tratamientos ({items.length})</Label>
              <div className="border rounded-lg divide-y">
                {items.map((item, index) => (
                  <div key={`${item.treatment_id || 'custom'}-${index}`} className="flex items-center gap-4 p-3">
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.treatment_name}
                        {item.isCustom && <span className="ml-2 text-xs text-muted-foreground">(Personalizado)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.unit_price.toLocaleString()} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-16"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                      />
                      {item.isCustom && (
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-5 w-full"
                            value={item.unit_price}
                            onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                      <span className="font-bold w-24 text-right">
                        ${item.total.toLocaleString()}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-muted">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Valid until */}
          <div className="space-y-2">
            <Label>Válido hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validUntil ? format(validUntil, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={validUntil}
                  onSelect={setValidUntil}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Presupuesto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBudgetDialog;
