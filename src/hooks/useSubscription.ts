import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PaymentProvider = "stripe" | "mercadopago";

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  productId: string | null;
  subscriptionEnd: string | null;
  provider: PaymentProvider | null;
  isLoading: boolean;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    plan: "free",
    productId: null,
    subscriptionEnd: null,
    provider: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }));
      
      // Check Stripe first
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke("check-subscription");
      
      if (!stripeError && stripeData?.subscribed) {
        setStatus({
          subscribed: true,
          plan: stripeData.plan || "individual",
          productId: stripeData.product_id,
          subscriptionEnd: stripeData.subscription_end,
          provider: "stripe",
          isLoading: false,
        });
        return;
      }

      // Check MercadoPago if no Stripe subscription
      const { data: mpData, error: mpError } = await supabase.functions.invoke("check-mp-subscription");
      
      if (!mpError && mpData?.subscribed) {
        setStatus({
          subscribed: true,
          plan: mpData.plan || "individual",
          productId: mpData.payment_id || null,
          subscriptionEnd: mpData.subscription_end,
          provider: "mercadopago",
          isLoading: false,
        });
        return;
      }

      // No active subscription
      setStatus({
        subscribed: false,
        plan: "free",
        productId: null,
        subscriptionEnd: null,
        provider: null,
        isLoading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setStatus({
        subscribed: false,
        plan: "free",
        productId: null,
        subscriptionEnd: null,
        provider: null,
        isLoading: false,
      });
    }
  }, []);

  const createCheckout = async (planId: string, provider: PaymentProvider = "stripe") => {
    try {
      const functionName = provider === "stripe" ? "create-checkout" : "create-mp-checkout";
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { planId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return true;
      }
      
      throw new Error("No checkout URL received");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear sesión de pago";
      toast.error(errorMessage);
      return false;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return true;
      }
      
      throw new Error("No portal URL received");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al abrir portal de gestión";
      toast.error(errorMessage);
      return false;
    }
  };

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription when returning from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionStatus = params.get("subscription");
    const provider = params.get("provider");
    
    if (subscriptionStatus === "success") {
      const providerLabel = provider === "mercadopago" ? "MercadoPago" : "Stripe";
      toast.success(`¡Suscripción activada exitosamente con ${providerLabel}!`);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(checkSubscription, 2000);
    } else if (subscriptionStatus === "cancelled" || subscriptionStatus === "failed") {
      toast.info("Proceso de suscripción cancelado");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (subscriptionStatus === "pending") {
      toast.info("Tu pago está pendiente de confirmación. Te notificaremos cuando esté listo.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkSubscription]);

  return {
    ...status,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
