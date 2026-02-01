import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-MP-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    logStep("MercadoPago token verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Search for payments by the user's email in external_reference
    // This is a simplified check - in production you'd use subscriptions/preapproval
    const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${user.id}:*&status=approved&sort=date_created&criteria=desc`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
      },
    });

    if (!searchResponse.ok) {
      logStep("MercadoPago search error", { status: searchResponse.status });
      // If we can't check, assume no subscription
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
        provider: "mercadopago",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const searchData = await searchResponse.json();
    logStep("Search results", { total: searchData.paging?.total || 0 });

    if (!searchData.results || searchData.results.length === 0) {
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
        provider: "mercadopago",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the most recent payment
    const latestPayment = searchData.results[0];
    const externalRef = latestPayment.external_reference || "";
    const planId = externalRef.split(":")[1] || "individual";
    
    // Check if payment is within the last 30 days (monthly subscription)
    const paymentDate = new Date(latestPayment.date_approved);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const isActive = paymentDate >= thirtyDaysAgo;
    
    // Calculate subscription end date (30 days from payment)
    const subscriptionEnd = new Date(paymentDate);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    logStep("Subscription status", { 
      isActive, 
      planId, 
      paymentDate: paymentDate.toISOString(),
      subscriptionEnd: subscriptionEnd.toISOString(),
    });

    return new Response(JSON.stringify({
      subscribed: isActive,
      plan: isActive ? planId : "free",
      provider: "mercadopago",
      subscription_end: isActive ? subscriptionEnd.toISOString() : null,
      payment_id: latestPayment.id,
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
