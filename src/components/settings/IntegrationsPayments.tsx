import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Note: maskSecret is no longer needed client-side as hints come from server
// The function is kept for backwards compatibility but not used

// Config for form state (new values being entered)
interface PaymentFormState {
  stripe_enabled: boolean;
  stripe_mode: "test" | "live";
  stripe_publishable_key: string;
  stripe_secret_key: string; // New value being entered
  stripe_webhook_secret: string; // New value being entered
  mp_enabled: boolean;
  mp_public_key: string;
  mp_access_token: string; // New value being entered
  mp_country: string;
  default_currency: string;
}

// Hints for displaying masked secrets (already configured)
interface SecretHints {
  stripe_secret_key_hint: string;
  stripe_webhook_secret_hint: string;
  mp_access_token_hint: string;
}

const IntegrationsPayments = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<PaymentFormState>({
    stripe_enabled: false,
    stripe_mode: "test",
    stripe_publishable_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    mp_enabled: false,
    mp_public_key: "",
    mp_access_token: "",
    mp_country: "",
    default_currency: "USD",
  });
  
  // Store masked hints separately - these are derived from existing secrets
  const [secretHints, setSecretHints] = useState<SecretHints>({
    stripe_secret_key_hint: "",
    stripe_webhook_secret_hint: "",
    mp_access_token_hint: "",
  });

  // Fetch config using secure RPC that returns hints instead of actual secrets
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["payment-config", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return null;
      // Use secure RPC function that returns hints, not actual secrets
      const { data, error } = await supabase
        .rpc('get_payment_config_safe', { p_clinic_id: profile.clinic_id });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!profile?.clinic_id,
  });

  useEffect(() => {
    if (existingConfig) {
      // Set non-sensitive values and public keys directly
      setConfig({
        stripe_enabled: existingConfig.stripe_enabled || false,
        stripe_mode: (existingConfig.stripe_mode as "test" | "live") || "test",
        stripe_publishable_key: existingConfig.stripe_publishable_key || "",
        stripe_secret_key: "", // Never load actual secret into state
        stripe_webhook_secret: "", // Never load actual secret into state
        mp_enabled: existingConfig.mp_enabled || false,
        mp_public_key: existingConfig.mp_public_key || "",
        mp_access_token: "", // Never load actual secret into state
        mp_country: existingConfig.mp_country || "",
        default_currency: existingConfig.default_currency || "USD",
      });
      
      // Use hints from secure RPC (already masked on server)
      setSecretHints({
        stripe_secret_key_hint: existingConfig.stripe_secret_key_hint || "",
        stripe_webhook_secret_hint: existingConfig.stripe_webhook_secret_hint || "",
        mp_access_token_hint: existingConfig.mp_access_token_hint || "",
      });
    }
  }, [existingConfig]);

  const saveMutation = useMutation({
    mutationFn: async (data: PaymentFormState) => {
      if (!profile?.clinic_id) throw new Error("No clinic found");

      if (existingConfig) {
        // For updates, build a partial payload with only changed fields
        const updatePayload: Record<string, unknown> = {
          stripe_enabled: data.stripe_enabled,
          stripe_mode: data.stripe_mode,
          stripe_publishable_key: data.stripe_publishable_key,
          mp_enabled: data.mp_enabled,
          mp_public_key: data.mp_public_key,
          mp_country: data.mp_country,
          default_currency: data.default_currency,
        };
        
        // Only update secrets if new values were provided
        if (data.stripe_secret_key) {
          updatePayload.stripe_secret_key = data.stripe_secret_key;
        }
        if (data.stripe_webhook_secret) {
          updatePayload.stripe_webhook_secret = data.stripe_webhook_secret;
        }
        if (data.mp_access_token) {
          updatePayload.mp_access_token = data.mp_access_token;
        }

        const { error } = await supabase
          .from("payment_config")
          .update(updatePayload)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        // For inserts, use properly typed payload
        const insertPayload = {
          clinic_id: profile.clinic_id,
          stripe_enabled: data.stripe_enabled,
          stripe_mode: data.stripe_mode,
          stripe_publishable_key: data.stripe_publishable_key,
          stripe_secret_key: data.stripe_secret_key || null,
          stripe_webhook_secret: data.stripe_webhook_secret || null,
          mp_enabled: data.mp_enabled,
          mp_public_key: data.mp_public_key,
          mp_access_token: data.mp_access_token || null,
          mp_country: data.mp_country,
          default_currency: data.default_currency,
        };

        const { error } = await supabase
          .from("payment_config")
          .insert(insertPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-config"] });
      // Clear the secret input fields after save
      setConfig(prev => ({
        ...prev,
        stripe_secret_key: "",
        stripe_webhook_secret: "",
        mp_access_token: "",
      }));
      toast.success("Configuración de pagos guardada");
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const stripeWebhookUrl = `${window.location.origin}/api/webhooks/stripe`;
  const mpWebhookUrl = `${window.location.origin}/api/webhooks/mercadopago`;

  const handleSave = () => {
    saveMutation.mutate(config);
  };

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
        <h2 className="text-2xl font-bold">Pasarelas de Pago</h2>
        <p className="text-muted-foreground">
          Configura las integraciones de pago para recibir pagos en línea de tus
          pacientes
        </p>
      </div>

      {/* Tabs Stripe / MercadoPago */}
      <Tabs defaultValue="stripe">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <span className="font-bold text-[#635BFF]">Stripe</span>
          </TabsTrigger>
          <TabsTrigger value="mercadopago" className="flex items-center gap-2">
            <span className="font-bold text-[#00B1EA]">MercadoPago</span>
          </TabsTrigger>
        </TabsList>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="mt-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Estado y Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estado:</span>
                  <Badge
                    variant={config.stripe_enabled ? "default" : "secondary"}
                    className={
                      config.stripe_enabled
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : ""
                    }
                  >
                    {config.stripe_enabled ? "🟢 Activo" : "⚪ No configurado"}
                  </Badge>
                </div>
                <Switch
                  checked={config.stripe_enabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, stripe_enabled: checked })
                  }
                />
              </div>

              {/* Modo Test/Live */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Label className="font-medium">Modo:</Label>
                <RadioGroup
                  value={config.stripe_mode}
                  onValueChange={(v) =>
                    setConfig({ ...config, stripe_mode: v as "test" | "live" })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="test" id="stripe-test" />
                    <Label htmlFor="stripe-test" className="flex items-center gap-1 cursor-pointer">
                      🧪 Test
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="live" id="stripe-live" />
                    <Label htmlFor="stripe-live" className="flex items-center gap-1 cursor-pointer">
                      🚀 Producción
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {config.stripe_mode === "test" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Modo de prueba activo. Los pagos no serán reales. Usa tarjeta{" "}
                    <code className="bg-muted px-1 rounded">4242 4242 4242 4242</code> para
                    probar.
                  </AlertDescription>
                </Alert>
              )}

              {/* Publishable Key */}
              <div className="space-y-2">
                <Label>Publishable Key *</Label>
                <Input
                  placeholder={
                    config.stripe_mode === "test" ? "pk_test_..." : "pk_live_..."
                  }
                  value={config.stripe_publishable_key}
                  onChange={(e) =>
                    setConfig({ ...config, stripe_publishable_key: e.target.value })
                  }
                />
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <Label>Secret Key *</Label>
                {secretHints.stripe_secret_key_hint && !config.stripe_secret_key && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Badge variant="outline" className="font-mono">
                      {secretHints.stripe_secret_key_hint}
                    </Badge>
                    <span className="text-green-600">✓ Configurado</span>
                  </div>
                )}
                <Input
                  type="password"
                  placeholder={
                    secretHints.stripe_secret_key_hint 
                      ? "Ingresa nuevo valor para reemplazar..." 
                      : config.stripe_mode === "test" ? "sk_test_..." : "sk_live_..."
                  }
                  value={config.stripe_secret_key}
                  onChange={(e) =>
                    setConfig({ ...config, stripe_secret_key: e.target.value })
                  }
                />
                {secretHints.stripe_secret_key_hint && (
                  <p className="text-xs text-muted-foreground">
                    Deja vacío para mantener el valor actual
                  </p>
                )}
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                {secretHints.stripe_webhook_secret_hint && !config.stripe_webhook_secret && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Badge variant="outline" className="font-mono">
                      {secretHints.stripe_webhook_secret_hint}
                    </Badge>
                    <span className="text-green-600">✓ Configurado</span>
                  </div>
                )}
                <Input
                  type="password"
                  placeholder={
                    secretHints.stripe_webhook_secret_hint 
                      ? "Ingresa nuevo valor para reemplazar..." 
                      : "whsec_..."
                  }
                  value={config.stripe_webhook_secret}
                  onChange={(e) =>
                    setConfig({ ...config, stripe_webhook_secret: e.target.value })
                  }
                />
                {secretHints.stripe_webhook_secret_hint && (
                  <p className="text-xs text-muted-foreground">
                    Deja vacío para mantener el valor actual
                  </p>
                )}
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL (configurar en Stripe Dashboard)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={stripeWebhookUrl} className="bg-muted" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(stripeWebhookUrl, "Webhook URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Moneda */}
              <div className="space-y-2">
                <Label>Moneda por defecto</Label>
                <Select
                  value={config.default_currency}
                  onValueChange={(v) =>
                    setConfig({ ...config, default_currency: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">🇺🇸 USD - Dólar Estadounidense</SelectItem>
                    <SelectItem value="MXN">🇲🇽 MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="CLP">🇨🇱 CLP - Peso Chileno</SelectItem>
                    <SelectItem value="COP">🇨🇴 COP - Peso Colombiano</SelectItem>
                    <SelectItem value="PEN">🇵🇪 PEN - Sol Peruano</SelectItem>
                    <SelectItem value="BRL">🇧🇷 BRL - Real Brasileño</SelectItem>
                    <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                    <SelectItem value="UYU">🇺🇾 UYU - Peso Uruguayo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4">
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* MercadoPago Tab */}
        <TabsContent value="mercadopago" className="mt-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Estado y Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estado:</span>
                  <Badge
                    variant={config.mp_enabled ? "default" : "secondary"}
                    className={
                      config.mp_enabled
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : ""
                    }
                  >
                    {config.mp_enabled ? "🟢 Activo" : "⚪ No configurado"}
                  </Badge>
                </div>
                <Switch
                  checked={config.mp_enabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, mp_enabled: checked })
                  }
                />
              </div>

              {/* País */}
              <div className="space-y-2">
                <Label>País *</Label>
                <Select
                  value={config.mp_country}
                  onValueChange={(v) => setConfig({ ...config, mp_country: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el país..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
                    <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                    <SelectItem value="CL">🇨🇱 Chile</SelectItem>
                    <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
                    <SelectItem value="MX">🇲🇽 México</SelectItem>
                    <SelectItem value="PE">🇵🇪 Perú</SelectItem>
                    <SelectItem value="UY">🇺🇾 Uruguay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Public Key */}
              <div className="space-y-2">
                <Label>Public Key *</Label>
                <Input
                  placeholder="APP_USR-..."
                  value={config.mp_public_key}
                  onChange={(e) =>
                    setConfig({ ...config, mp_public_key: e.target.value })
                  }
                />
              </div>

              {/* Access Token */}
              <div className="space-y-2">
                <Label>Access Token *</Label>
                {secretHints.mp_access_token_hint && !config.mp_access_token && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Badge variant="outline" className="font-mono">
                      {secretHints.mp_access_token_hint}
                    </Badge>
                    <span className="text-green-600">✓ Configurado</span>
                  </div>
                )}
                <Input
                  type="password"
                  placeholder={
                    secretHints.mp_access_token_hint 
                      ? "Ingresa nuevo valor para reemplazar..." 
                      : "APP_USR-..."
                  }
                  value={config.mp_access_token}
                  onChange={(e) =>
                    setConfig({ ...config, mp_access_token: e.target.value })
                  }
                />
                {secretHints.mp_access_token_hint && (
                  <p className="text-xs text-muted-foreground">
                    Deja vacío para mantener el valor actual
                  </p>
                )}
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL (configurar en MercadoPago)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={mpWebhookUrl} className="bg-muted" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(mpWebhookUrl, "Webhook URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4">
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsPayments;
