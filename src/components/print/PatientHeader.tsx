import { forwardRef } from "react";

interface PatientHeaderProps {
  patient: {
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    birth_date?: string | null;
    gender?: string | null;
  };
  clinicName?: string;
  professionalName?: string;
}

const PatientHeader = forwardRef<HTMLDivElement, PatientHeaderProps>(
  ({ patient, clinicName = "DentalCRM Pro", professionalName }, ref) => {
    const fullName = `${patient.first_name} ${patient.last_name}`;
    const age = patient.birth_date 
      ? Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return (
      <div ref={ref} className="hidden print:block mb-6 pb-4 border-b-2 border-primary">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-primary">{clinicName}</h1>
            {professionalName && (
              <p className="text-sm font-medium">{professionalName}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Fecha de impresión: {new Date().toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold">{fullName}</h2>
            <div className="text-sm text-muted-foreground">
              {age && <span>{age} años</span>}
              {patient.gender && (
                <span className="ml-2">
                  • {patient.gender === "male" ? "Masculino" : patient.gender === "female" ? "Femenino" : "Otro"}
                </span>
              )}
            </div>
            {patient.phone && <p className="text-xs">Tel: {patient.phone}</p>}
            {patient.email && <p className="text-xs">{patient.email}</p>}
          </div>
        </div>
      </div>
    );
  }
);

PatientHeader.displayName = "PatientHeader";

export default PatientHeader;
