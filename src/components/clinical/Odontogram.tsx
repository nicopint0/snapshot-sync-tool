import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TEETH_ADULT = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

const TOOTH_CONDITIONS = {
  healthy: { color: "bg-background border-border", label: "Sano" },
  cavity: { color: "bg-red-500", label: "Caries" },
  filling: { color: "bg-blue-500", label: "Obturado" },
  crown: { color: "bg-yellow-500", label: "Corona" },
  extraction: { color: "bg-muted text-muted-foreground", label: "Extraído" },
  implant: { color: "bg-purple-500", label: "Implante" },
  root_canal: { color: "bg-orange-500", label: "Endodoncia" },
  bridge: { color: "bg-cyan-500", label: "Puente" },
  veneer: { color: "bg-pink-500", label: "Carilla" },
};

type ToothCondition = keyof typeof TOOTH_CONDITIONS;

interface ToothData {
  tooth_number: number;
  condition: ToothCondition;
  notes?: string;
  surfaces?: string[];
}

interface OdontogramProps {
  patientId?: string;
  data?: ToothData[];
  onSave?: (data: ToothData[]) => void;
  readOnly?: boolean;
}

const Odontogram = ({ data = [], onSave, readOnly = false }: OdontogramProps) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [teethData, setTeethData] = useState<ToothData[]>(data);
  const [toothNotes, setToothNotes] = useState("");

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

  const ToothIcon = ({ number }: { number: number }) => {
    const condition = getToothCondition(number);
    const conditionData = TOOTH_CONDITIONS[condition];
    const isSelected = selectedTooth === number;
    const hasNotes = getToothData(number)?.notes;

    return (
      <div
        onClick={() => handleToothClick(number)}
        className={cn(
          "w-9 h-12 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center relative",
          conditionData.color,
          isSelected && "ring-2 ring-primary ring-offset-2",
          !readOnly && "hover:scale-105",
          condition === "healthy" && "text-foreground",
          condition !== "healthy" && condition !== "extraction" && "text-white"
        )}
      >
        <span className="text-xs font-bold">{number}</span>
        {/* Surface indicator */}
        <div className="grid grid-cols-3 gap-px mt-1">
          <div className="w-1.5 h-1.5 bg-current opacity-30 rounded-sm" />
          <div className="w-1.5 h-1.5 bg-current opacity-30 rounded-sm" />
          <div className="w-1.5 h-1.5 bg-current opacity-30 rounded-sm" />
        </div>
        {hasNotes && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl p-6 border">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Odontograma</h3>
          <p className="text-sm text-muted-foreground">
            {readOnly ? "Vista de solo lectura" : "Haz clic en un diente para editar su estado"}
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOOTH_CONDITIONS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              <div
                className={cn(
                  "w-3 h-3 rounded border",
                  value.color,
                  key === "healthy" && "border-border"
                )}
              />
              <span className="text-muted-foreground">{value.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upper Arch */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2 text-center">Arcada Superior</p>
        <div className="flex justify-center gap-1 flex-wrap">
          {TEETH_ADULT.upper.map((tooth) => (
            <ToothIcon key={tooth} number={tooth} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-muted my-6" />

      {/* Lower Arch */}
      <div>
        <div className="flex justify-center gap-1 flex-wrap">
          {TEETH_ADULT.lower.map((tooth) => (
            <ToothIcon key={tooth} number={tooth} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">Arcada Inferior</p>
      </div>

      {/* Selected tooth panel */}
      {selectedTooth && !readOnly && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
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
    </div>
  );
};

export default Odontogram;
