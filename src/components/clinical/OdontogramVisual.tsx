import { useState, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ToothSVG from "./ToothSVG";

// FDI notation - adult teeth
const TEETH_FDI = {
  upper: {
    right: [18, 17, 16, 15, 14, 13, 12, 11], // Quadrant 1
    left: [21, 22, 23, 24, 25, 26, 27, 28],  // Quadrant 2
  },
  lower: {
    left: [31, 32, 33, 34, 35, 36, 37, 38],  // Quadrant 3
    right: [48, 47, 46, 45, 44, 43, 42, 41], // Quadrant 4
  },
};

const TOOTH_CONDITIONS = {
  healthy: { color: "bg-[hsl(var(--tooth-healthy))]", label: "Sano" },
  cavity: { color: "bg-[hsl(var(--tooth-caries))]", label: "Caries" },
  filling: { color: "bg-[hsl(var(--tooth-filling))]", label: "Obturado" },
  crown: { color: "bg-[hsl(var(--tooth-crown))]", label: "Corona" },
  extraction: { color: "bg-muted", label: "Extraído" },
  implant: { color: "bg-purple-400", label: "Implante" },
  root_canal: { color: "bg-orange-400", label: "Endodoncia" },
  bridge: { color: "bg-cyan-400", label: "Puente" },
  veneer: { color: "bg-pink-400", label: "Carilla" },
};

type ToothCondition = keyof typeof TOOTH_CONDITIONS;

interface ToothData {
  tooth_number: number;
  condition: ToothCondition;
  notes?: string;
  surfaces?: string[];
}

interface OdontogramVisualProps {
  patientId?: string;
  data?: ToothData[];
  onSave?: (data: ToothData[]) => void;
  readOnly?: boolean;
}

const OdontogramVisual = forwardRef<HTMLDivElement, OdontogramVisualProps>(
  ({ data = [], onSave, readOnly = false }, ref) => {
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [teethData, setTeethData] = useState<ToothData[]>(data);
    const [toothNotes, setToothNotes] = useState("");

    // Sync teethData when data prop changes
    useEffect(() => {
      setTeethData(data);
    }, [data]);

    const getToothData = (toothNumber: number): ToothData | undefined => {
      return teethData.find((t) => t.tooth_number === toothNumber);
    };

    const getToothCondition = (toothNumber: number): ToothCondition => {
      const tooth = getToothData(toothNumber);
      return tooth?.condition || "healthy";
    };

    const handleToothClick = (toothNumber: number) => {
      if (readOnly) return;
      setSelectedTooth(toothNumber);
      const tooth = getToothData(toothNumber);
      setToothNotes(tooth?.notes || "");
    };

    const updateToothCondition = (toothNumber: number, condition: ToothCondition) => {
      const newData = [...teethData];
      const index = newData.findIndex((t) => t.tooth_number === toothNumber);

      if (index >= 0) {
        newData[index].condition = condition;
      } else {
        newData.push({ tooth_number: toothNumber, condition, notes: toothNotes });
      }

      setTeethData(newData);
      onSave?.(newData);
    };

    const updateToothNotes = () => {
      if (!selectedTooth) return;
      
      const newData = [...teethData];
      const index = newData.findIndex((t) => t.tooth_number === selectedTooth);

      if (index >= 0) {
        newData[index].notes = toothNotes;
      } else {
        newData.push({ tooth_number: selectedTooth, condition: "healthy", notes: toothNotes });
      }

      setTeethData(newData);
      onSave?.(newData);
    };

    const renderToothRow = (teeth: number[], isUpper: boolean) => {
      return teeth.map((tooth) => (
        <ToothSVG
          key={tooth}
          number={tooth}
          isUpper={isUpper}
          condition={getToothCondition(tooth)}
          isSelected={selectedTooth === tooth}
          hasNotes={!!getToothData(tooth)?.notes}
          onClick={() => handleToothClick(tooth)}
          readOnly={readOnly}
        />
      ));
    };

    return (
      <div ref={ref} className="bg-card rounded-xl p-6 border print:border-none print:p-2 print:bg-white print:block">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6 print:mb-4">
          <div>
            <h3 className="text-lg font-semibold">Odontograma</h3>
            <p className="text-sm text-muted-foreground print:hidden">
              {readOnly ? "Vista de solo lectura" : "Haz clic en un diente para editar su estado"}
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 print:gap-1">
            {Object.entries(TOOTH_CONDITIONS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1 text-xs print:text-[8px]">
                <div
                  className={cn(
                    "w-3 h-3 rounded border print:w-2 print:h-2",
                    value.color,
                    key === "healthy" && "border-border"
                  )}
                />
                <span className="text-muted-foreground">{value.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Odontogram Chart */}
        <div className="relative">
          {/* Arcade Labels */}
          <div className="text-center mb-2">
            <span className="text-sm font-medium text-primary">Arcada Maxilar (Superior)</span>
          </div>

          {/* Upper Arch */}
          <div className="relative mb-2">
            {/* Center line indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30 -translate-x-1/2" />
            
            <div className="flex justify-center items-end gap-0.5 md:gap-1">
              {/* Right side (patient's right) */}
              <div className="flex items-end gap-0.5 md:gap-1">
                <span className="text-[10px] text-muted-foreground mr-1 print:text-[8px]">Derecha</span>
                {renderToothRow(TEETH_FDI.upper.right, true)}
              </div>
              
              {/* Separator */}
              <div className="w-2 md:w-4" />
              
              {/* Left side (patient's left) */}
              <div className="flex items-end gap-0.5 md:gap-1">
                {renderToothRow(TEETH_FDI.upper.left, true)}
                <span className="text-[10px] text-muted-foreground ml-1 print:text-[8px]">Izquierda</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 my-4 print:my-2">
            <div className="flex-1 border-t-2 border-dashed border-primary/30" />
            <span className="text-xs text-muted-foreground px-2">FDI</span>
            <div className="flex-1 border-t-2 border-dashed border-primary/30" />
          </div>

          {/* Lower Arch */}
          <div className="relative mt-2">
            {/* Center line indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30 -translate-x-1/2" />
            
            <div className="flex justify-center items-start gap-0.5 md:gap-1">
              {/* Right side (patient's right) */}
              <div className="flex items-start gap-0.5 md:gap-1">
                <span className="text-[10px] text-muted-foreground mr-1 print:text-[8px]">Derecha</span>
                {renderToothRow(TEETH_FDI.lower.right, false)}
              </div>
              
              {/* Separator */}
              <div className="w-2 md:w-4" />
              
              {/* Left side (patient's left) */}
              <div className="flex items-start gap-0.5 md:gap-1">
                {renderToothRow(TEETH_FDI.lower.left, false)}
                <span className="text-[10px] text-muted-foreground ml-1 print:text-[8px]">Izquierda</span>
              </div>
            </div>
          </div>

          {/* Arcade Labels */}
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-primary">Arcada Mandibular (Inferior)</span>
          </div>
        </div>

        {/* Selected tooth panel - hidden in print */}
        {selectedTooth && !readOnly && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border print:hidden">
            <h4 className="font-medium mb-3">
              Diente #{selectedTooth}
              {getToothData(selectedTooth)?.condition && 
                getToothData(selectedTooth)?.condition !== "healthy" && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({TOOTH_CONDITIONS[getToothData(selectedTooth)!.condition].label})
                </span>
              )}
            </h4>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(TOOTH_CONDITIONS).map(([key, value]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={getToothCondition(selectedTooth) === key ? "default" : "outline"}
                    onClick={() => updateToothCondition(selectedTooth, key as ToothCondition)}
                    className="text-xs"
                  >
                    {value.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tooth-notes">Notas del diente</Label>
                <Textarea
                  id="tooth-notes"
                  placeholder="Agregar notas sobre este diente..."
                  value={toothNotes}
                  onChange={(e) => setToothNotes(e.target.value)}
                  onBlur={updateToothNotes}
                  rows={2}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTooth(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Print-only: List of conditions */}
        <div className="hidden print:block mt-4 text-xs">
          <h4 className="font-semibold mb-2">Registro de Condiciones:</h4>
          <div className="grid grid-cols-4 gap-1">
            {teethData.filter(t => t.condition !== "healthy").map(tooth => (
              <div key={tooth.tooth_number} className="flex gap-1">
                <span className="font-medium">#{tooth.tooth_number}:</span>
                <span>{TOOTH_CONDITIONS[tooth.condition].label}</span>
              </div>
            ))}
          </div>
          {teethData.filter(t => t.notes).length > 0 && (
            <div className="mt-2">
              <h5 className="font-semibold">Notas:</h5>
              {teethData.filter(t => t.notes).map(tooth => (
                <p key={tooth.tooth_number} className="text-[10px]">
                  <span className="font-medium">#{tooth.tooth_number}:</span> {tooth.notes}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

OdontogramVisual.displayName = "OdontogramVisual";

export default OdontogramVisual;
