import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { patientSchema, validateForm, type PatientFormData } from "@/lib/validations";

const NewPatient = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
    birthDate: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    allergies: "",
    medications: "",
    medicalNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateForm(patientSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors || {});
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }
    
    setErrors({});
    
    if (!profile?.clinic_id) {
      toast.error("No se encontró la clínica asociada");
      return;
    }

    setIsLoading(true);

    try {
      const validData = validation.data!;
      const { error } = await supabase.from("patients").insert({
        clinic_id: profile.clinic_id,
        first_name: validData.firstName.trim(),
        last_name: validData.lastName.trim(),
        email: validData.email?.trim() || null,
        phone: validData.phone?.trim() || null,
        whatsapp: validData.whatsapp?.trim() || null,
        birth_date: validData.birthDate || null,
        gender: validData.gender || null,
        address: validData.address?.trim() || null,
        city: validData.city?.trim() || null,
        state: validData.state?.trim() || null,
        postal_code: validData.postalCode?.trim() || null,
        emergency_contact_name: validData.emergencyContactName?.trim() || null,
        emergency_contact_phone: validData.emergencyContactPhone?.trim() || null,
        allergies: validData.allergies ? validData.allergies.split(",").map(a => a.trim()).filter(Boolean) : null,
        medications: validData.medications ? validData.medications.split(",").map(m => m.trim()).filter(Boolean) : null,
        medical_notes: validData.medicalNotes?.trim() || null,
      });

      if (error) throw error;

      toast.success("Paciente creado exitosamente");
      navigate("/patients");
    } catch (error: any) {
      toast.error(error.message || "Error al crear el paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getFieldError = (field: string) => errors[field];

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("patients.newPatient")}
            </h1>
            <p className="text-muted-foreground">
              Completa la información del nuevo paciente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  maxLength={100}
                  className={getFieldError("firstName") ? "border-destructive" : ""}
                />
                {getFieldError("firstName") && (
                  <p className="text-sm text-destructive">{getFieldError("firstName")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  maxLength={100}
                  className={getFieldError("lastName") ? "border-destructive" : ""}
                />
                {getFieldError("lastName") && (
                  <p className="text-sm text-destructive">{getFieldError("lastName")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  maxLength={255}
                  className={getFieldError("email") ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dirección</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado/Provincia</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nombre del Contacto</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => updateField("emergencyContactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Teléfono del Contacto</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial Médico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias (separadas por coma)</Label>
                <Input
                  id="allergies"
                  placeholder="Ej: Penicilina, Látex"
                  value={formData.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Medicamentos Actuales (separados por coma)</Label>
                <Input
                  id="medications"
                  placeholder="Ej: Aspirina, Omeprazol"
                  value={formData.medications}
                  onChange={(e) => updateField("medications", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Notas Médicas</Label>
                <Textarea
                  id="medicalNotes"
                  placeholder="Condiciones médicas relevantes, observaciones..."
                  value={formData.medicalNotes}
                  onChange={(e) => updateField("medicalNotes", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/patients")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Paciente
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </AppLayout>
  );
};

export default NewPatient;