import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface ServiceWorkerRegistrationWithPush extends ServiceWorkerRegistration {
  pushManager: PushManager;
}

interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
}

interface PushConfigRecord {
  vapid_public_key: string | null;
  vapid_private_key: string | null;
  vapid_email: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistrationWithPush | null>(null);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setRegistration(reg as ServiceWorkerRegistrationWithPush);
      })
      .catch((err) => {
        console.error("[Push] Service Worker registration failed:", err);
      });
  }, [isSupported]);

  const { data: pushConfig } = useQuery({
    queryKey: ["push-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_config")
        .select("vapid_public_key, vapid_private_key, vapid_email")
        .single();
      if (error) throw error;
      return data as PushConfigRecord;
    },
    staleTime: 0,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["push-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PushSubscriptionRecord[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!registration || !user) return;
    registration.pushManager.getSubscription().then((sub) => {
      if (sub) {
        const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
        setIsSubscribed(exists);
      } else {
        setIsSubscribed(false);
      }
    });
  }, [registration, user, subscriptions]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !pushConfig?.vapid_public_key || !user) {
        throw new Error("Push notifications not available");
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        throw new Error("Notification permission denied");
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      const existingEndpoint = existingSubscription?.endpoint;
      const existsInDbForThisUser = !!existingEndpoint && subscriptions.some((s) => s.endpoint === existingEndpoint);

      if (existingSubscription && !existsInDbForThisUser) {
        try {
          await existingSubscription.unsubscribe();
        } catch (e) {
          console.warn("[Push] Failed to unsubscribe existing subscription:", e);
        }
      }

      const applicationServerKey = urlBase64ToUint8Array(pushConfig.vapid_public_key);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();

      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
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
      if (error.message === "Notification permission denied") {
        toast.error("Permissão de notificações negada. Verifique as configurações do navegador.");
      } else {
        toast.error("Erro ao ativar notificações push");
      }
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !user) return;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint)
          .eq("user_id", user.id);
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

  const revokeSubscription = useCallback(
    async (subscriptionId: string) => {
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
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
    isConfigured: !!pushConfig?.vapid_public_key,
    permission,
    isSubscribed,
    subscriptions,
    subscribe,
    unsubscribe,
    revokeSubscription,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}

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
