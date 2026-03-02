import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  recipient_id: string;
  category: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
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
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000,
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
    refetchInterval: 15000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc("mark_notifications_read", {
        _user_id: user.id,
        _ids: notificationIds || null,
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
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
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
  recipientId: string;
  title: string;
  body: string;
  category?: string;
  link?: string;
}) {
  const { data, error } = await supabase.rpc("create_notification", {
    _recipient_id: params.recipientId,
    _title: params.title,
    _body: params.body,
    _category: params.category || "general",
    _link: params.link || null,
  });

  if (error) throw error;
  return data;
}

// Notification event keys
export const NOTIFICATION_EVENTS = {
  APPOINTMENT_CREATED: "appointment.created",
  APPOINTMENT_CONFIRMED: "appointment.confirmed",
  APPOINTMENT_RESCHEDULED: "appointment.rescheduled",
  APPOINTMENT_CANCELED: "appointment.canceled",
  APPOINTMENT_REMINDER_24H: "appointment.reminder_24h",
  APPOINTMENT_REMINDER_2H: "appointment.reminder_2h",
  PAYMENT_CREATED: "payment.created",
  PAYMENT_PAID: "payment.paid",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  EMAIL_FAILED: "email.failed",
  USER_INVITED: "user.invited",
  USER_ROLE_CHANGED: "user.role_changed",
} as const;
