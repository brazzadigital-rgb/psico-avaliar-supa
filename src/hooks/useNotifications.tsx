import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  recipient_user_id: string;
  category: "consultas" | "pagamentos" | "sistema" | "conteudo";
  event_key: string;
  title: string;
  body: string | null;
  action_url: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata_json: Record<string, any>;
  status: "queued" | "sent" | "failed";
  priority: "low" | "normal" | "high";
  read_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc("get_unread_notification_count", {
        _user_id: user.id,
      });
      if (error) throw error;
      return data || 0;
    },
    enabled: !!user,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc("mark_notifications_read", {
        _user_id: user.id,
        _notification_ids: notificationIds || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload) => {
          // Refetch on new notification
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAsRead = useCallback(
    (notificationIds?: string[]) => {
      markAsReadMutation.mutate(notificationIds);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAsReadMutation.mutate(undefined);
  }, [markAsReadMutation]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}

// Helper to create notifications (for use in other hooks/components)
export async function createNotification(params: {
  recipientUserId: string;
  category: "consultas" | "pagamentos" | "sistema" | "conteudo";
  eventKey: string;
  title: string;
  body?: string;
  actionUrl?: string;
  resourceType?: string;
  resourceId?: string;
  priority?: "low" | "normal" | "high";
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase.rpc("create_notification", {
    _recipient_user_id: params.recipientUserId,
    _category: params.category,
    _event_key: params.eventKey,
    _title: params.title,
    _body: params.body || null,
    _action_url: params.actionUrl || null,
    _resource_type: params.resourceType || null,
    _resource_id: params.resourceId || null,
    _priority: params.priority || "normal",
    _metadata: params.metadata || {},
  });

  if (error) throw error;
  return data;
}

// Notification event keys
export const NOTIFICATION_EVENTS = {
  // Appointments
  APPOINTMENT_CREATED: "appointment.created",
  APPOINTMENT_CONFIRMED: "appointment.confirmed",
  APPOINTMENT_RESCHEDULED: "appointment.rescheduled",
  APPOINTMENT_CANCELED: "appointment.canceled",
  APPOINTMENT_REMINDER_24H: "appointment.reminder_24h",
  APPOINTMENT_REMINDER_2H: "appointment.reminder_2h",
  APPOINTMENT_REMINDER_15M: "appointment.reminder_15m",
  APPOINTMENT_MEET_LINK_ADDED: "appointment.meet_link_added",
  
  // Payments
  PAYMENT_CREATED: "payment.created",
  PAYMENT_PAID: "payment.paid",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  
  // System
  EMAIL_FAILED: "email.failed",
  USER_INVITED: "user.invited",
  USER_ROLE_CHANGED: "user.role_changed",
} as const;
