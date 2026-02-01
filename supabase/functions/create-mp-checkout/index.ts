import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// MercadoPago plan IDs (preapproval_plan) for each subscription tier
// These need to be created in MercadoPago dashboard or via API
const MP_PLANS: Record<string, { title: string; price: number; currency: string }> = {
  individual: { title: "Plan Individual", price: 10000, currency: "CLP" },
  profesional: { title: "Plan Profesional", price: 15000, currency: "CLP" },
  business: { title: "Plan Business", price: 40000, currency: "CLP" },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MP-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planId } = await req.json();
    logStep("Received request", { planId });

    const planConfig = MP_PLANS[planId];
    if (!planConfig) {
      throw new Error("Invalid plan ID");
    }
    logStep("Plan config", planConfig);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    const origin = req.headers.get("origin") || "https://snapshot-sync-tool.lovable.app";

    // Create a preference for subscription-like payment
    // MercadoPago subscriptions require preapproval_plan, but for simplicity
    // we'll create a preference that redirects to checkout
    const preferenceData = {
      items: [
        {
          title: planConfig.title,
          quantity: 1,
          unit_price: planConfig.price,
          currency_id: planConfig.currency,
          description: `Suscripción mensual - ${planConfig.title}`,
        },
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${origin}/settings?subscription=success&provider=mercadopago`,
        failure: `${origin}/settings?subscription=failed&provider=mercadopago`,
        pending: `${origin}/settings?subscription=pending&provider=mercadopago`,
      },
      auto_return: "approved",
      external_reference: `${user.id}:${planId}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    };

    logStep("Creating preference", preferenceData);

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      logStep("MercadoPago API error", { status: mpResponse.status, error: errorData });
      throw new Error(`MercadoPago API error: ${mpResponse.status}`);
    }

    const preference = await mpResponse.json();
    logStep("Preference created", { id: preference.id, init_point: preference.init_point });

    return new Response(JSON.stringify({ 
      url: preference.init_point,
      sandbox_url: preference.sandbox_init_point,
      preference_id: preference.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
