import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration_minutes: number | null;
  is_active: boolean | null;
}

interface EditTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: Treatment | null;
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

const EditTreatmentDialog = ({ open, onOpenChange, treatment }: EditTreatmentDialogProps) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: 30,
    category: "",
    is_active: true,
  });

  useEffect(() => {
    if (treatment) {
      setFormData({
        name: treatment.name,
        description: treatment.description || "",
        price: treatment.price.toString(),
        duration_minutes: treatment.duration_minutes || 30,
        category: treatment.category || "",
        is_active: treatment.is_active ?? true,
      });
    }
  }, [treatment]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!treatment) throw new Error("No treatment selected");
      
      const { error } = await supabase
        .from("treatments")
        .update({
          name: data.name,
          description: data.description || null,
          price: parseFloat(data.price) || 0,
          duration_minutes: data.duration_minutes,
          category: data.category || null,
          is_active: data.is_active,
        })
        .eq("id", treatment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast.success("Tratamiento actualizado exitosamente");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error al actualizar tratamiento: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Tratamiento</DialogTitle>
          <DialogDescription>
            Modifica los datos del tratamiento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Ej: Limpieza dental"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción del tratamiento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duración (minutos)</Label>
            <Select
              value={formData.duration_minutes.toString()}
              onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}
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
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
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

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label>Tratamiento activo</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTreatmentDialog;
