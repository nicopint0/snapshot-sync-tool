import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Budget {
  id: string;
  status: string | null;
  total: number | null;
  created_at: string;
  budget_items?: { id: string; description: string; quantity: number; unit_price: number; total: number }[];
}

interface BudgetPrintSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: Budget[];
  onSelectBudget: (budget: Budget) => void;
}

const BudgetPrintSelector = ({
  open,
  onOpenChange,
  budgets,
  onSelectBudget,
}: BudgetPrintSelectorProps) => {
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("");

  const handlePrint = () => {
    const budget = budgets.find(b => b.id === selectedBudgetId);
    if (budget) {
      onSelectBudget(budget);
      onOpenChange(false);
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "approved": return "Aprobado";
      case "completed": return "Realizado";
      case "sent": return "Enviado";
      case "rejected": return "Rechazado";
      default: return "Borrador";
    }
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case "approved": return "default";
      case "completed": return "default";
      case "sent": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  // Filter out rejected budgets
  const printableBudgets = budgets.filter(b => b.status !== "rejected");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Presupuesto a Imprimir</DialogTitle>
        </DialogHeader>

        {printableBudgets.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No hay presupuestos disponibles para imprimir
          </p>
        ) : (
          <>
            <RadioGroup
              value={selectedBudgetId}
              onValueChange={setSelectedBudgetId}
              className="space-y-3"
            >
              {printableBudgets.map((budget) => (
                <div
                  key={budget.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBudgetId === budget.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedBudgetId(budget.id)}
                >
                  <RadioGroupItem value={budget.id} id={budget.id} />
                  <Label htmlFor={budget.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getStatusVariant(budget.status) as any}
                            className={budget.status === "completed" ? "bg-green-600" : ""}
                          >
                            {getStatusLabel(budget.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(budget.created_at).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {budget.budget_items?.length || 0} items
                        </p>
                      </div>
                      <p className="font-bold text-lg">
                        ${budget.total?.toLocaleString() || 0}
                      </p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePrint} disabled={!selectedBudgetId}>
                Imprimir Presupuesto
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BudgetPrintSelector;
