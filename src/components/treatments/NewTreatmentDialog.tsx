import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { treatmentSchema, validateForm, type TreatmentFormData } from "@/lib/validations";

interface NewTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Prevención",
  "Estética",
  "Cirugía",
  "Restauración",
  "Prótesis",
  "Endodoncia",
  "Ortodoncia",
  "Implantes",
  "Periodoncia",
  "Otro",
];

const NewTreatmentDialog = ({ open, onOpenChange }: NewTreatmentDialogProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [treatment, setTreatment] = useState<TreatmentFormData>({
    name: "",
    description: "",
    price: "",
    duration_minutes: 30,
    category: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: TreatmentFormData) => {
      if (!profile?.clinic_id) throw new Error("No clinic found");
      
      const { error } = await supabase.from("treatments").insert({
        clinic_id: profile.clinic_id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price ? parseFloat(data.price) : 0,
        duration_minutes: data.duration_minutes,
        category: data.category?.trim() || null,
        is_active: true,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast.success("Tratamiento creado exitosamente");
      handleClose();
    },
    onError: (error) => {
      toast.error("Error al crear tratamiento: " + error.message);
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTreatment({
      name: "",
      description: "",
      price: "",
      duration_minutes: 30,
      category: "",
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateForm(treatmentSchema, treatment);
    if (!validation.success) {
      setErrors(validation.errors || {});
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }
    
    setErrors({});
    createMutation.mutate(treatment);
  };

  const getFieldError = (field: string) => errors[field];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Tratamiento</DialogTitle>
          <DialogDescription>
            Agrega un nuevo tratamiento al catálogo de la clínica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Ej: Limpieza dental"
              value={treatment.name}
              onChange={(e) => setTreatment({ ...treatment, name: e.target.value })}
              maxLength={100}
              className={getFieldError("name") ? "border-destructive" : ""}
            />
            {getFieldError("name") && (
              <p className="text-sm text-destructive">{getFieldError("name")}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción del tratamiento..."
              value={treatment.description}
              onChange={(e) => setTreatment({ ...treatment, description: e.target.value })}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                placeholder="0.00"
                value={treatment.price}
                onChange={(e) => setTreatment({ ...treatment, price: e.target.value })}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duración (minutos)</Label>
            <Select
              value={treatment.duration_minutes.toString()}
              onValueChange={(v) => setTreatment({ ...treatment, duration_minutes: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={treatment.category}
              onValueChange={(v) => setTreatment({ ...treatment, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                "Crear Tratamiento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTreatmentDialog;
