import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    plan: "free",
    productId: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        // Don't show error toast on initial load - just set free plan
        setStatus({
          subscribed: false,
          plan: "free",
          productId: null,
          subscriptionEnd: null,
          isLoading: false,
        });
        return;
      }

      setStatus({
        subscribed: data.subscribed,
        plan: data.plan || "free",
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        isLoading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setStatus({
        subscribed: false,
        plan: "free",
        productId: null,
        subscriptionEnd: null,
        isLoading: false,
      });
    }
  }, []);

  const createCheckout = async (planId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open checkout in new tab
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
    if (params.get("subscription") === "success") {
      toast.success("¡Suscripción activada exitosamente!");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh subscription status
      setTimeout(checkSubscription, 2000);
    } else if (params.get("subscription") === "cancelled") {
      toast.info("Proceso de suscripción cancelado");
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
