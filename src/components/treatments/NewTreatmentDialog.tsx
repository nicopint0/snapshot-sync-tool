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

interface NewTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TreatmentData {
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  category: string;
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
  
  const [treatment, setTreatment] = useState<TreatmentData>({
    name: "",
    description: "",
    price: "",
    duration_minutes: 30,
    category: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: TreatmentData) => {
      if (!profile?.clinic_id) throw new Error("No clinic found");
      
      const { error } = await supabase.from("treatments").insert({
        clinic_id: profile.clinic_id,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        duration_minutes: data.duration_minutes,
        category: data.category || null,
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!treatment.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    
    createMutation.mutate(treatment);
  };

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
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción del tratamiento..."
              value={treatment.description}
              onChange={(e) => setTreatment({ ...treatment, description: e.target.value })}
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
