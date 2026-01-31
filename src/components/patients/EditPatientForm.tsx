import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const patientSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es requerido").max(100),
  last_name: z.string().trim().min(1, "El apellido es requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  emergency_contact_name: z.string().trim().max(100).optional().or(z.literal("")),
  emergency_contact_phone: z.string().trim().max(20).optional().or(z.literal("")),
  medical_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies: string[] | null;
  medications: string[] | null;
  medical_notes: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface EditPatientFormProps {
  patient: Patient;
  onSave: (updatedPatient: Patient) => void;
  onCancel: () => void;
}

const EditPatientForm = ({ patient, onSave, onCancel }: EditPatientFormProps) => {
  const queryClient = useQueryClient();
  const [allergies, setAllergies] = useState<string[]>(patient.allergies || []);
  const [medications, setMedications] = useState<string[]>(patient.medications || []);
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email || "",
      phone: patient.phone || "",
      whatsapp: patient.whatsapp || "",
      birth_date: patient.birth_date || "",
      gender: patient.gender || "",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      postal_code: patient.postal_code || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      medical_notes: patient.medical_notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const { error } = await supabase
        .from("patients")
        .update({
          ...data,
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          birth_date: data.birth_date || null,
          gender: data.gender || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          postal_code: data.postal_code || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          medical_notes: data.medical_notes || null,
          allergies,
          medications,
        })
        .eq("id", patient.id);

      if (error) throw error;

      return {
        ...patient,
        ...data,
        allergies,
        medications,
      };
    },
    onSuccess: (updatedPatient) => {
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
      toast.success("Paciente actualizado correctamente");
      onSave(updatedPatient as Patient);
    },
    onError: (error) => {
      toast.error("Error al actualizar: " + error.message);
    },
  });

  const addAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy));
  };

  const addMedication = () => {
    const trimmed = newMedication.trim();
    if (trimmed && !medications.includes(trimmed)) {
      setMedications([...medications, trimmed]);
      setNewMedication("");
    }
  };

  const removeMedication = (medication: string) => {
    setMedications(medications.filter((m) => m !== medication));
  };

  const onSubmit = (data: PatientFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end gap-2 mb-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  {...register("first_name")}
                  className={errors.first_name ? "border-destructive" : ""}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  {...register("last_name")}
                  className={errors.last_name ? "border-destructive" : ""}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...register("birth_date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select
                  value={watch("gender")}
                  onValueChange={(value) => setValue("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" {...register("whatsapp")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado/Región</Label>
                <Input id="state" {...register("state")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">C.P.</Label>
                <Input id="postal_code" {...register("postal_code")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Médica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Allergies */}
            <div className="space-y-2">
              <Label>Alergias</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {allergies.map((allergy, i) => (
                  <Badge key={i} variant="destructive" className="gap-1">
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="ml-1 hover:bg-destructive-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva alergia"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addAllergy}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label>Medicamentos</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {medications.map((med, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {med}
                    <button
                      type="button"
                      onClick={() => removeMedication(med)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nuevo medicamento"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMedication();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addMedication}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Medical Notes */}
            <div className="space-y-2">
              <Label htmlFor="medical_notes">Notas Médicas</Label>
              <Textarea
                id="medical_notes"
                {...register("medical_notes")}
                rows={4}
                placeholder="Antecedentes, condiciones especiales, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Nombre</Label>
              <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Teléfono</Label>
              <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};

export default EditPatientForm;
