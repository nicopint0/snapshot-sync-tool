import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Loader2,
  MessageCircle,
  FileText,
  CreditCard,
  Stethoscope,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import Odontogram from "@/components/clinical/Odontogram";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

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

type ToothCondition = Database["public"]["Enums"]["tooth_condition"];

interface OdontogramData {
  id: string;
  tooth_number: number;
  condition: ToothCondition;
  notes: string | null;
  surfaces: string[] | null;
}

const PatientDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");

  // Fetch patient
  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        setPatient(data);
      } catch (error) {
        console.error("Error fetching patient:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  // Fetch odontogram data
  const { data: odontogramData = [] } = useQuery({
    queryKey: ["odontogram", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("odontograms")
        .select("*")
        .eq("patient_id", id);
      if (error) throw error;
      return data as OdontogramData[];
    },
    enabled: !!id,
  });

  // Save odontogram mutation
  const saveOdontogramMutation = useMutation({
    mutationFn: async (teethData: { tooth_number: number; condition: string; notes?: string }[]) => {
      if (!id) throw new Error("No patient ID");

      // Upsert each tooth
      for (const tooth of teethData) {
        const { error } = await supabase
          .from("odontograms")
          .upsert({
            patient_id: id,
            tooth_number: tooth.tooth_number,
            condition: tooth.condition as ToothCondition,
            notes: tooth.notes || null,
          }, {
            onConflict: "patient_id,tooth_number",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["odontogram", id] });
      toast.success("Odontograma guardado");
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  const handleSaveOdontogram = (teethData: { tooth_number: number; condition: string; notes?: string }[]) => {
    saveOdontogramMutation.mutate(teethData);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-muted-foreground">Paciente no encontrado</p>
          <Button onClick={() => navigate("/patients")}>
            Volver a Pacientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const fullName = `${patient.first_name} ${patient.last_name}`;
  const age = patient.birth_date 
    ? Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={patient.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
                <div className="flex items-center gap-3 text-muted-foreground">
                  {age && <span>{age} años</span>}
                  {patient.gender && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{patient.gender === "male" ? "Masculino" : patient.gender === "female" ? "Femenino" : "Otro"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {patient.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${patient.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </a>
                </Button>
              )}
              {patient.whatsapp && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://wa.me/${patient.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
            <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
            <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {(patient.address || patient.city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {patient.address && <p>{patient.address}</p>}
                        {(patient.city || patient.state) && (
                          <p className="text-muted-foreground">
                            {[patient.city, patient.state, patient.postal_code].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {patient.birth_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(patient.birth_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Médica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Alergias</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        patient.allergies.map((allergy, i) => (
                          <Badge key={i} variant="destructive">
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin alergias registradas</span>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Medicamentos</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.medications && patient.medications.length > 0 ? (
                        patient.medications.map((med, i) => (
                          <Badge key={i} variant="secondary">
                            {med}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin medicamentos registrados</span>
                      )}
                    </div>
                  </div>
                  {patient.medical_notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Notas Médicas</p>
                        <p className="text-sm">{patient.medical_notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.emergency_contact_name && (
                      <p className="font-medium">{patient.emergency_contact_name}</p>
                    )}
                    {patient.emergency_contact_phone && (
                      <p className="text-muted-foreground">{patient.emergency_contact_phone}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximas Citas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">No hay citas programadas</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="odontogram">
            <Odontogram
              patientId={id}
              data={odontogramData.map(o => ({
                tooth_number: o.tooth_number,
                condition: o.condition as any,
                notes: o.notes || undefined,
                surfaces: o.surfaces || undefined,
              }))}
              onSave={handleSaveOdontogram}
            />
          </TabsContent>

          <TabsContent value="treatments">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Tratamientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No hay tratamientos registrados para este paciente</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Presupuestos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No hay presupuestos registrados para este paciente</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Historial de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No hay pagos registrados para este paciente</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos y Radiografías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No hay documentos subidos para este paciente</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

export default PatientDetail;