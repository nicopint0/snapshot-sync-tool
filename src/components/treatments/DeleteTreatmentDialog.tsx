import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Treatment {
  id: string;
  name: string;
}

interface DeleteTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: Treatment | null;
}

const DeleteTreatmentDialog = ({ open, onOpenChange, treatment }: DeleteTreatmentDialogProps) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!treatment) throw new Error("No treatment selected");
      
      const { error } = await supabase
        .from("treatments")
        .delete()
        .eq("id", treatment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast.success("Tratamiento eliminado exitosamente");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error al eliminar tratamiento: " + error.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Eliminar Tratamiento</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            ¿Estás seguro de que deseas eliminar el tratamiento{" "}
            <strong>"{treatment?.name}"</strong>? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTreatmentDialog;
