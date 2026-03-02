import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Extend ServiceWorkerRegistration to include Push API
interface ServiceWorkerRegistrationWithPush extends ServiceWorkerRegistration {
  pushManager: PushManager;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  device_label: string | null;
  user_agent: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface PushConfig {
  vapid_public_key: string | null;
  sender_name: string;
  is_configured: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistrationWithPush | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[Push] Service Worker registered:", reg);
        setRegistration(reg as ServiceWorkerRegistrationWithPush);
      })
      .catch((err) => {
        console.error("[Push] Service Worker registration failed:", err);
      });
  }, [isSupported]);

  // Fetch push config (VAPID public key)
  const { data: pushConfig } = useQuery({
    queryKey: ["push-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_config")
        .select("vapid_public_key, sender_name, is_configured")
        .single();

      if (error) {
        console.error("[Push] Config fetch error:", error);
        throw error;
      }
      console.log("[Push] Config loaded:", data);
      return data as PushConfig;
    },
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch user's subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["push-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PushSubscription[];
    },
    enabled: !!user,
  });

  // Check if current browser is subscribed
  useEffect(() => {
    if (!registration || !user) return;

    registration.pushManager.getSubscription().then((sub) => {
      if (sub) {
        // Check if this subscription exists in our database
        const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
        setIsSubscribed(exists);
      } else {
        setIsSubscribed(false);
      }
    });
  }, [registration, user, subscriptions]);

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !pushConfig?.vapid_public_key || !user) {
        throw new Error("Push notifications not available");
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error("Notification permission denied");
      }

      // If this browser is already subscribed (often from an older login),
      // unsubscribe first so we can register it cleanly for the current user.
      const existingSubscription = await registration.pushManager.getSubscription();
      const existingEndpoint = existingSubscription?.endpoint;
      const existsInDbForThisUser = !!existingEndpoint && subscriptions.some((s) => s.endpoint === existingEndpoint);

      if (existingSubscription && !existsInDbForThisUser) {
        console.log("[Push] Existing browser subscription belongs to another session/user. Resetting...");
        try {
          await existingSubscription.unsubscribe();
        } catch (e) {
          console.warn("[Push] Failed to unsubscribe existing subscription:", e);
        }
      }

      // Subscribe to push manager
      const applicationServerKey = urlBase64ToUint8Array(pushConfig.vapid_public_key);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
        device_label: getDeviceLabel(),
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
    },
    onError: (error: Error) => {
      console.error("[Push] Subscribe error:", error);
      if (error.message === "Notification permission denied") {
        toast.error("Permissão de notificações negada. Verifique as configurações do navegador.");
      } else {
        toast.error("Erro ao ativar notificações push");
      }
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !user) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Revoke in database
        await supabase
          .from("push_subscriptions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("endpoint", subscription.endpoint)
          .eq("user_id", user.id);

        // Unsubscribe from browser
        await subscription.unsubscribe();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      setIsSubscribed(false);
      toast.success("Notificações push desativadas");
    },
    onError: () => {
      toast.error("Erro ao desativar notificações push");
    },
  });

  // Revoke specific subscription
  const revokeSubscription = useCallback(
    async (subscriptionId: string) => {
      const { error } = await supabase
        .from("push_subscriptions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", subscriptionId);

      if (error) {
        toast.error("Erro ao revogar dispositivo");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      toast.success("Dispositivo removido");
    },
    [queryClient]
  );

  const subscribe = useCallback(() => {
    subscribeMutation.mutate();
  }, [subscribeMutation]);

  const unsubscribe = useCallback(() => {
    unsubscribeMutation.mutate();
  }, [unsubscribeMutation]);

  return {
    isSupported,
    isConfigured: pushConfig?.is_configured ?? false,
    permission,
    isSubscribed,
    subscriptions,
    subscribe,
    unsubscribe,
    revokeSubscription,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to get device label
function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Navegador";
}
