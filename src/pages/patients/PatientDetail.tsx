import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Printer,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import OdontogramVisual from "@/components/clinical/OdontogramVisual";
import PatientHeader from "@/components/print/PatientHeader";
import EditPatientForm from "@/components/patients/EditPatientForm";
import NewBudgetDialog from "@/components/budgets/NewBudgetDialog";
import NewTreatmentDialog from "@/components/treatments/NewTreatmentDialog";
import { usePrint } from "@/hooks/usePrint";
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(location.pathname.endsWith("/edit"));
  const [activeTab, setActiveTab] = useState("summary");
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  
  // Refs for printing
  const odontogramRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const treatmentsRef = useRef<HTMLDivElement>(null);
  const budgetsRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);
  
  // Print hooks for each section
  const { contentRef: printOdontogramRef, handlePrint: printOdontogram } = usePrint<HTMLDivElement>({
    title: `Odontograma - ${patient?.first_name} ${patient?.last_name}`,
  });
  
  const { contentRef: printSummaryRef, handlePrint: printSummary } = usePrint<HTMLDivElement>({
    title: `Resumen - ${patient?.first_name} ${patient?.last_name}`,
  });
  
  const { contentRef: printTreatmentsRef, handlePrint: printTreatments } = usePrint<HTMLDivElement>({
    title: `Tratamientos - ${patient?.first_name} ${patient?.last_name}`,
  });
  
  const { contentRef: printBudgetsRef, handlePrint: printBudgets } = usePrint<HTMLDivElement>({
    title: `Presupuestos - ${patient?.first_name} ${patient?.last_name}`,
  });
  
  const { contentRef: printFullRef, handlePrint: printFullReport } = usePrint<HTMLDivElement>({
    title: `Ficha Clínica - ${patient?.first_name} ${patient?.last_name}`,
  });

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

  // Fetch patient budgets
  const { data: patientBudgets = [] } = useQuery({
    queryKey: ["patient-budgets", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          budget_items(id, description, quantity, unit_price, total)
        `)
        .eq("patient_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch patient payments
  const { data: patientPayments = [] } = useQuery({
    queryKey: ["patient-payments", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("patient_id", id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
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
            
            <div className="flex gap-2 flex-wrap">
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
              
              {/* Print dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={printFullReport}>
                    Ficha Clínica Completa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printSummary}>
                    Solo Resumen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printOdontogram}>
                    Solo Odontograma
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printTreatments}>
                    Solo Tratamientos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printBudgets}>
                    Solo Presupuestos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button size="sm" onClick={() => {
                setIsEditing(!isEditing);
                if (!isEditing) {
                  navigate(`/patients/${id}/edit`, { replace: true });
                } else {
                  navigate(`/patients/${id}`, { replace: true });
                }
              }}>
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Form or Tabs */}
        {isEditing ? (
          <EditPatientForm
            patient={patient}
            onSave={(updatedPatient) => {
              setPatient(updatedPatient);
              setIsEditing(false);
              navigate(`/patients/${id}`, { replace: true });
            }}
            onCancel={() => {
              setIsEditing(false);
              navigate(`/patients/${id}`, { replace: true });
            }}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
              <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
              <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <div ref={printSummaryRef}>
                <PatientHeader patient={patient} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                {/* Contact Info */}
                <Card className="print:border print:shadow-none">
                  <CardHeader className="print:pb-2">
                    <CardTitle className="text-lg print:text-sm">Información de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 print:space-y-2 print:text-xs">
                    {patient.email && (
                      <div className="flex items-center gap-3 print:gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground print:h-3 print:w-3" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-3 print:gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground print:h-3 print:w-3" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {(patient.address || patient.city) && (
                      <div className="flex items-start gap-3 print:gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 print:h-3 print:w-3" />
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
                      <div className="flex items-center gap-3 print:gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground print:h-3 print:w-3" />
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
                <Card className="print:border print:shadow-none">
                  <CardHeader className="print:pb-2">
                    <CardTitle className="text-lg print:text-sm">Información Médica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 print:space-y-2 print:text-xs">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 print:text-xs print:mb-1">Alergias</p>
                      <div className="flex flex-wrap gap-2 print:gap-1">
                        {patient.allergies && patient.allergies.length > 0 ? (
                          patient.allergies.map((allergy, i) => (
                            <Badge key={i} variant="destructive" className="print:text-[10px] print:px-1 print:py-0">
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
                      <p className="text-sm text-muted-foreground mb-2 print:text-xs print:mb-1">Medicamentos</p>
                      <div className="flex flex-wrap gap-2 print:gap-1">
                        {patient.medications && patient.medications.length > 0 ? (
                          patient.medications.map((med, i) => (
                            <Badge key={i} variant="secondary" className="print:text-[10px] print:px-1 print:py-0">
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
                          <p className="text-sm text-muted-foreground mb-2 print:text-xs print:mb-1">Notas Médicas</p>
                          <p className="text-sm print:text-xs">{patient.medical_notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
                  <Card className="print:border print:shadow-none">
                    <CardHeader className="print:pb-2">
                      <CardTitle className="text-lg print:text-sm">Contacto de Emergencia</CardTitle>
                    </CardHeader>
                    <CardContent className="print:text-xs">
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
                <Card className="print:border print:shadow-none">
                  <CardHeader className="print:pb-2">
                    <CardTitle className="text-lg print:text-sm">Próximas Citas</CardTitle>
                  </CardHeader>
                  <CardContent className="print:text-xs">
                    <p className="text-muted-foreground text-sm">No hay citas programadas</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="odontogram">
            <div ref={printOdontogramRef}>
              <PatientHeader patient={patient} />
              <OdontogramVisual
                patientId={id}
                data={odontogramData.map(o => ({
                  tooth_number: o.tooth_number,
                  condition: o.condition as any,
                  notes: o.notes || undefined,
                  surfaces: o.surfaces || undefined,
                }))}
                onSave={handleSaveOdontogram}
              />
            </div>
          </TabsContent>

          <TabsContent value="treatments">
            <div ref={printTreatmentsRef}>
              <PatientHeader patient={patient} />
              <Card className="print:border print:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Tratamientos
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowTreatmentDialog(true)} className="print:hidden">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Tratamiento
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No hay tratamientos registrados para este paciente</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budgets">
            <div ref={printBudgetsRef}>
              <PatientHeader patient={patient} />
              <Card className="print:border print:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Presupuestos ({patientBudgets.length})
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowBudgetDialog(true)} className="print:hidden">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Presupuesto
                  </Button>
                </CardHeader>
                <CardContent>
                  {patientBudgets.length === 0 ? (
                    <p className="text-muted-foreground">No hay presupuestos registrados para este paciente</p>
                  ) : (
                    <div className="space-y-4">
                      {patientBudgets.map((budget) => (
                        <Card key={budget.id} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    budget.status === "approved" ? "default" :
                                    budget.status === "sent" ? "secondary" :
                                    budget.status === "rejected" ? "destructive" :
                                    "outline"
                                  }>
                                    {budget.status === "approved" ? "Aprobado" :
                                     budget.status === "sent" ? "Enviado" :
                                     budget.status === "rejected" ? "Rechazado" :
                                     "Borrador"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(budget.created_at).toLocaleDateString("es-ES")}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {budget.budget_items?.length || 0} items
                                </p>
                                {budget.notes && (
                                  <p className="text-sm text-muted-foreground">{budget.notes}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">${budget.total?.toLocaleString() || 0}</p>
                                {budget.discount_percent > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    -{budget.discount_percent}% descuento
                                  </p>
                                )}
                              </div>
                            </div>
                            {budget.budget_items && budget.budget_items.length > 0 && (
                              <div className="mt-4 border-t pt-4">
                                <p className="text-sm font-medium mb-2">Detalle:</p>
                                <ul className="text-sm space-y-1">
                                  {budget.budget_items.map((item: any) => (
                                    <li key={item.id} className="flex justify-between">
                                      <span>{item.description} x{item.quantity}</span>
                                      <span className="text-muted-foreground">${item.total?.toLocaleString()}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Historial de Pagos ({patientPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientPayments.length === 0 ? (
                  <p className="text-muted-foreground">No hay pagos registrados para este paciente</p>
                ) : (
                  <div className="space-y-3">
                    {patientPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">${payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString("es-ES")} • {
                              payment.payment_method === "cash" ? "Efectivo" :
                              payment.payment_method === "card" ? "Tarjeta" :
                              payment.payment_method === "transfer" ? "Transferencia" :
                              payment.payment_method
                            }
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

          </Tabs>
        )}
        {/* Hidden full report container for printing all sections */}
        <div ref={printFullRef} className="hidden">
          <PatientHeader patient={patient} />
          
          {/* Summary section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Resumen del Paciente</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Información de Contacto</h3>
                {patient.email && <p>Email: {patient.email}</p>}
                {patient.phone && <p>Teléfono: {patient.phone}</p>}
                {patient.address && <p>Dirección: {patient.address}</p>}
                {patient.city && <p>Ciudad: {patient.city}, {patient.state}</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Información Médica</h3>
                <p>Alergias: {patient.allergies?.join(", ") || "Ninguna"}</p>
                <p>Medicamentos: {patient.medications?.join(", ") || "Ninguno"}</p>
                {patient.medical_notes && <p>Notas: {patient.medical_notes}</p>}
              </div>
            </div>
          </div>
          
          {/* Odontogram section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Odontograma</h2>
            <OdontogramVisual
              patientId={id}
              data={odontogramData.map(o => ({
                tooth_number: o.tooth_number,
                condition: o.condition as any,
                notes: o.notes || undefined,
                surfaces: o.surfaces || undefined,
              }))}
              readOnly
            />
          </div>
          
          {/* Treatments placeholder */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Tratamientos</h2>
            <p className="text-sm text-muted-foreground">No hay tratamientos registrados</p>
          </div>
          
          {/* Budgets placeholder */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Presupuestos</h2>
            <p className="text-sm text-muted-foreground">No hay presupuestos registrados</p>
          </div>
        </div>
        {/* Dialogs */}
        <NewBudgetDialog
          open={showBudgetDialog}
          onOpenChange={setShowBudgetDialog}
          preselectedPatient={patient ? { id: patient.id, first_name: patient.first_name, last_name: patient.last_name } : null}
        />
        <NewTreatmentDialog
          open={showTreatmentDialog}
          onOpenChange={setShowTreatmentDialog}
        />
      </motion.div>
    </AppLayout>
  );
};

export default PatientDetail;