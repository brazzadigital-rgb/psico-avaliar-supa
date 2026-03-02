import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Json;
  newValues?: Json;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = useCallback(async ({
    action,
    entityType,
    entityId,
    oldValues,
    newValues
  }: AuditLogParams) => {
    if (!user) return;

    try {
      await supabase.from("audit_logs").insert([{
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues ?? null,
        new_values: newValues ?? null
      }]);
    } catch (error) {
      console.error("Failed to log audit action:", error);
    }
  }, [user]);

  return { logAction };
}

// Common audit actions
export const AUDIT_ACTIONS = {
  // Users
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_ACTIVATED: 'user.activated',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_PERMISSION_OVERRIDE: 'user.permission_override',
  USER_INVITED: 'user.invited',
  USER_INVITE_ACCEPTED: 'user.invite_accepted',
  
  // Roles
  ROLE_PERMISSION_ADDED: 'role.permission_added',
  ROLE_PERMISSION_REMOVED: 'role.permission_removed',
  
  // Appointments
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_UPDATED: 'appointment.updated',
  APPOINTMENT_CANCELED: 'appointment.canceled',
  APPOINTMENT_RESCHEDULED: 'appointment.rescheduled',
  APPOINTMENT_COMPLETED: 'appointment.completed',
  
  // Clients
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_DELETED: 'client.deleted',
  
  // Settings
  SETTINGS_UPDATED: 'settings.updated',
  SMTP_CONFIGURED: 'smtp.configured',
  OAUTH_CONFIGURED: 'oauth.configured',
  
  // Blog
  BLOG_POST_CREATED: 'blog.post_created',
  BLOG_POST_UPDATED: 'blog.post_updated',
  BLOG_POST_PUBLISHED: 'blog.post_published',
  BLOG_POST_DELETED: 'blog.post_deleted',
  
  // Login
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested'
} as const;
