import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Bell, FileText, Send, Settings2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EmailSettings {
  id?: string;
  clinic_id?: string;
  from_name: string;
  reply_to_email: string;
  reminder_enabled: boolean;
  reminder_hours_before: number;
  send_appointment_confirmation: boolean;
  send_appointment_reminder: boolean;
  send_appointment_cancelled: boolean;
  send_budget_created: boolean;
  send_payment_receipt: boolean;
  send_welcome_email: boolean;
  email_signature: string;
}

const defaultSettings: EmailSettings = {
  from_name: "",
  reply_to_email: "",
  reminder_enabled: true,
  reminder_hours_before: 24,
  send_appointment_confirmation: true,
  send_appointment_reminder: true,
  send_appointment_cancelled: true,
  send_budget_created: true,
  send_payment_receipt: true,
  send_welcome_email: true,
  email_signature: "",
};

export default function IntegrationsEmail() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<EmailSettings>(defaultSettings);

  // Fetch settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["email-settings", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return null;

      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .eq("clinic_id", profile.clinic_id)
        .maybeSingle();

      if (error) throw error;
      return data as EmailSettings | null;
    },
    enabled: !!profile?.clinic_id,
  });

  // Fetch email stats
  const { data: stats } = useQuery({
    queryKey: ["email-stats", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("email_logs")
        .select("status")
        .eq("clinic_id", profile.clinic_id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const delivered = data?.filter(e => e.status === "delivered" || e.status === "sent").length || 0;
      const failed = data?.filter(e => e.status === "bounced" || e.status === "failed").length || 0;

      return {
        total,
        delivered,
        failed,
        deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(0) : 0,
      };
    },
    enabled: !!profile?.clinic_id,
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings({
        ...defaultSettings,
        ...currentSettings,
      });
    }
  }, [currentSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinic_id) throw new Error("No clinic found");

      const { error } = await supabase
        .from("email_settings")
        .upsert({
          clinic_id: profile.clinic_id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  // Test email mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No hay email del usuario");

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: user.email,
          template: "appointment_reminder",
          clinicId: profile?.clinic_id,
          data: {
            patientName: "Usuario de Prueba",
            date: "Lunes, 15 de enero de 2025",
            time: "10:00",
            dentistName: "Dr. Ejemplo",
            treatment: "Limpieza dental",
            isToday: false,
          },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al enviar");
    },
    onSuccess: () => {
      toast.success("Email de prueba enviado a tu correo");
    },
    onError: (error) => {
      toast.error("Error al enviar: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Configuración de Emails</h2>
          <p className="text-sm text-muted-foreground">Personaliza los emails automáticos que envía tu clínica</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Guardar cambios
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-sm text-muted-foreground">Emails enviados (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
            <p className="text-sm text-muted-foreground">Entregados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            <p className="text-sm text-muted-foreground">Fallidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats?.deliveryRate}%</div>
            <p className="text-sm text-muted-foreground">Tasa de entrega</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Mail className="h-4 w-4 mr-2" />
            Recordatorios
          </TabsTrigger>
          <TabsTrigger value="signature">
            <FileText className="h-4 w-4 mr-2" />
            Firma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del remitente</CardTitle>
              <CardDescription>Define cómo aparecerán tus emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del remitente</Label>
                  <Input
                    value={settings.from_name}
                    onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                    placeholder="Nombre de tu clínica"
                  />
                  <p className="text-xs text-muted-foreground">
                    Si está vacío, se usará el nombre de la clínica
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Email de respuesta</Label>
                  <Input
                    type="email"
                    value={settings.reply_to_email}
                    onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value })}
                    placeholder="contacto@tuclinica.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Los pacientes responderán a este email
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {testMutation.isPending ? "Enviando..." : "Enviar email de prueba"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de notificaciones</CardTitle>
              <CardDescription>Activa o desactiva los emails automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Confirmación de cita</p>
                  <p className="text-sm text-muted-foreground">Cuando se agenda una cita nueva</p>
                </div>
                <Switch
                  checked={settings.send_appointment_confirmation}
                  onCheckedChange={(v) => setSettings({ ...settings, send_appointment_confirmation: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorio de cita</p>
                  <p className="text-sm text-muted-foreground">Antes de la cita programada</p>
                </div>
                <Switch
                  checked={settings.send_appointment_reminder}
                  onCheckedChange={(v) => setSettings({ ...settings, send_appointment_reminder: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cita cancelada</p>
                  <p className="text-sm text-muted-foreground">Cuando se cancela una cita</p>
                </div>
                <Switch
                  checked={settings.send_appointment_cancelled}
                  onCheckedChange={(v) => setSettings({ ...settings, send_appointment_cancelled: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Presupuesto creado</p>
                  <p className="text-sm text-muted-foreground">Cuando se genera un presupuesto</p>
                </div>
                <Switch
                  checked={settings.send_budget_created}
                  onCheckedChange={(v) => setSettings({ ...settings, send_budget_created: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recibo de pago</p>
                  <p className="text-sm text-muted-foreground">Cuando se registra un pago</p>
                </div>
                <Switch
                  checked={settings.send_payment_receipt}
                  onCheckedChange={(v) => setSettings({ ...settings, send_payment_receipt: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email de bienvenida</p>
                  <p className="text-sm text-muted-foreground">Al registrar un nuevo paciente</p>
                </div>
                <Switch
                  checked={settings.send_welcome_email}
                  onCheckedChange={(v) => setSettings({ ...settings, send_welcome_email: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recordatorios automáticos</CardTitle>
              <CardDescription>Configura cuándo enviar recordatorios de citas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Activar recordatorios automáticos</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar emails automáticos antes de cada cita
                  </p>
                </div>
                <Switch
                  checked={settings.reminder_enabled}
                  onCheckedChange={(v) => setSettings({ ...settings, reminder_enabled: v })}
                />
              </div>

              {settings.reminder_enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Enviar recordatorio</Label>
                    <Select
                      value={settings.reminder_hours_before.toString()}
                      onValueChange={(v) => setSettings({ ...settings, reminder_hours_before: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 horas antes</SelectItem>
                        <SelectItem value="24">24 horas antes (1 día)</SelectItem>
                        <SelectItem value="48">48 horas antes (2 días)</SelectItem>
                        <SelectItem value="72">72 horas antes (3 días)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      💡 Los recordatorios se procesan automáticamente según la configuración establecida
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Firma de email</CardTitle>
              <CardDescription>Texto que aparecerá al final de cada email</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.email_signature}
                onChange={(e) => setSettings({ ...settings, email_signature: e.target.value })}
                placeholder="Escribe tu firma personalizada aquí..."
                rows={6}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Ejemplo: "Atentamente, El equipo de [Nombre de tu clínica]"
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
