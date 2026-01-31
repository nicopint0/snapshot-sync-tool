import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Helper to mask secrets - only show last 4 chars
const maskSecret = (secret: string | null | undefined): string => {
  if (!secret || secret.length < 8) return "";
  return "••••••••" + secret.slice(-4);
};

interface WhatsAppFormState {
  phone_number_id: string;
  business_account_id: string;
  access_token: string; // New value being entered
  verify_token: string;
  is_connected: boolean;
  last_verified_at: string | null;
}

const IntegrationsWhatsApp = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  const [accessTokenHint, setAccessTokenHint] = useState("");
  const [config, setConfig] = useState<WhatsAppFormState>({
    phone_number_id: "",
    business_account_id: "",
    access_token: "",
    verify_token: `wh_verify_${crypto.randomUUID().slice(0, 12)}`,
    is_connected: false,
    last_verified_at: null,
  });

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["whatsapp-config", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return null;
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select(`
          id,
          phone_number_id,
          business_account_id,
          access_token,
          verify_token,
          is_connected,
          last_verified_at
        `)
        .eq("clinic_id", profile.clinic_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.clinic_id,
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        phone_number_id: existingConfig.phone_number_id || "",
        business_account_id: existingConfig.business_account_id || "",
        access_token: "", // Never load actual secret into state
        verify_token: existingConfig.verify_token || config.verify_token,
        is_connected: existingConfig.is_connected || false,
        last_verified_at: existingConfig.last_verified_at,
      });
      // Generate masked hint from existing secret
      setAccessTokenHint(maskSecret(existingConfig.access_token));
    }
  }, [existingConfig]);

  const saveMutation = useMutation({
    mutationFn: async (data: WhatsAppFormState) => {
      if (!profile?.clinic_id) throw new Error("No clinic found");

      if (existingConfig) {
        // For updates, build a partial payload with only changed fields
        const updatePayload: Record<string, unknown> = {
          phone_number_id: data.phone_number_id,
          business_account_id: data.business_account_id,
          verify_token: data.verify_token,
          is_connected: data.is_connected,
          last_verified_at: data.last_verified_at,
        };
        
        // Only update access_token if new value was provided
        if (data.access_token) {
          updatePayload.access_token = data.access_token;
        }

        const { error } = await supabase
          .from("whatsapp_config")
          .update(updatePayload)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        // For inserts, use properly typed payload
        const insertPayload = {
          clinic_id: profile.clinic_id,
          phone_number_id: data.phone_number_id,
          business_account_id: data.business_account_id,
          access_token: data.access_token || null,
          verify_token: data.verify_token,
          is_connected: data.is_connected,
          last_verified_at: data.last_verified_at,
        };

        const { error } = await supabase
          .from("whatsapp_config")
          .insert(insertPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      // Clear the secret input field after save
      setConfig(prev => ({ ...prev, access_token: "" }));
      toast.success("Configuración guardada correctamente");
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  const testConnection = async () => {
    // For testing, we need either a new token or an existing configured token
    const hasToken = config.access_token || accessTokenHint;
    if (!config.phone_number_id || !hasToken) {
      toast.error("Ingresa Phone Number ID y Access Token para probar");
      return;
    }
    
    // If user hasn't entered a new token but has one configured, inform them
    if (!config.access_token && accessTokenHint) {
      toast.error("Para probar la conexión, ingresa el Access Token nuevamente");
      return;
    }

    // Validate phone_number_id format (numeric only to prevent URL manipulation)
    const phoneIdRegex = /^\d+$/;
    if (!phoneIdRegex.test(config.phone_number_id)) {
      toast.error("Phone Number ID debe ser numérico");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${encodeURIComponent(config.phone_number_id)}`,
        {
          headers: {
            'Authorization': `Bearer ${config.access_token}`
          }
        }
      );
      
      if (response.ok) {
        setConfig((prev) => ({
          ...prev,
          is_connected: true,
          last_verified_at: new Date().toISOString(),
        }));
        toast.success("✓ Conexión exitosa con WhatsApp Business API");
      } else {
        const error = await response.json();
        setConfig((prev) => ({ ...prev, is_connected: false }));
        toast.error(`Error: ${error.error?.message || "Conexión fallida"}`);
      }
    } catch (error) {
      setConfig((prev) => ({ ...prev, is_connected: false }));
      toast.error("Error de conexión. Verifica tus credenciales.");
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.phone_number_id || !config.business_account_id || !config.access_token) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    saveMutation.mutate(config);
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/whatsapp`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">WhatsApp Business API</h2>
        <p className="text-muted-foreground">
          Conecta tu número de WhatsApp Business para enviar recordatorios
          automáticos y comunicarte con tus pacientes
        </p>
      </div>

      {/* Configuración */}
      <Card>
        <CardContent className="pt-6">
          {/* Estado de conexión */}
          <div className="flex items-center gap-2 mb-6">
            <span className="font-medium">Estado:</span>
            {config.is_connected ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                No conectado
              </Badge>
            )}
            {config.last_verified_at && (
              <span className="text-sm text-muted-foreground">
                Última verificación:{" "}
                {new Date(config.last_verified_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number ID */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
              <Input
                id="phoneNumberId"
                placeholder="Ej: 123456789012345"
                value={config.phone_number_id}
                onChange={(e) =>
                  setConfig({ ...config, phone_number_id: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Encuéntralo en Meta Business Suite → WhatsApp Manager →
                Configuración de la cuenta
              </p>
            </div>

            {/* Business Account ID */}
            <div className="space-y-2">
              <Label htmlFor="businessAccountId">Business Account ID *</Label>
              <Input
                id="businessAccountId"
                placeholder="Ej: 987654321098765"
                value={config.business_account_id}
                onChange={(e) =>
                  setConfig({ ...config, business_account_id: e.target.value })
                }
              />
            </div>

            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              {accessTokenHint && !config.access_token && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Badge className="font-mono bg-muted text-muted-foreground">
                    {accessTokenHint}
                  </Badge>
                  <span className="text-green-600">✓ Configurado</span>
                </div>
              )}
              <Input
                id="accessToken"
                type="password"
                placeholder={
                  accessTokenHint 
                    ? "Ingresa nuevo valor para reemplazar..." 
                    : "EAABx..."
                }
                value={config.access_token}
                onChange={(e) =>
                  setConfig({ ...config, access_token: e.target.value })
                }
              />
              {accessTokenHint && (
                <p className="text-xs text-muted-foreground">
                  Deja vacío para mantener el valor actual
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Genera un token permanente en Meta for Developers
              </p>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label>Webhook URL (para configurar en Meta)</Label>
              <div className="flex gap-2">
                <Input readOnly value={webhookUrl} className="bg-muted" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verify Token */}
            <div className="space-y-2">
              <Label>Verify Token</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={config.verify_token}
                  className="bg-muted font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(config.verify_token, "Verify Token")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Probando...
                  </>
                ) : (
                  "Probar Conexión"
                )}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Configuración"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📖 Instrucciones de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Ve a{" "}
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Meta Business Suite
              </a>{" "}
              → WhatsApp Manager
            </li>
            <li>Selecciona o crea una cuenta de WhatsApp Business</li>
            <li>En "Configuración de la cuenta", copia el Phone Number ID</li>
            <li>
              El Business Account ID está en la URL o en "Configuración del
              negocio"
            </li>
            <li>
              Ve a{" "}
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Meta for Developers
              </a>{" "}
              para generar un Access Token permanente
            </li>
            <li>En "Webhooks", configura la URL y Verify Token de arriba</li>
            <li>
              Suscríbete a los eventos: <code className="bg-muted px-1 rounded">messages</code>,{" "}
              <code className="bg-muted px-1 rounded">message_templates</code>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsWhatsApp;
