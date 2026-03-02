import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Permission {
  permission_key: string;
  permission_name: string;
  category: string;
  source: string;
}

interface PermissionsContextType {
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, userRole, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_permissions', {
        _user_id: user.id
      });

      if (error) {
        console.error("Error fetching permissions:", error);
        setPermissions([]);
      } else {
        setPermissions(data || []);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchPermissions();
    }
  }, [authLoading, fetchPermissions, userRole]);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    return permissions.some(p => p.permission_key === permissionKey);
  }, [permissions, userRole]);

  const hasAnyPermission = useCallback((permissionKeys: string[]): boolean => {
    if (userRole === 'admin') return true;
    return permissionKeys.some(key => hasPermission(key));
  }, [hasPermission, userRole]);

  const hasAllPermissions = useCallback((permissionKeys: string[]): boolean => {
    if (userRole === 'admin') return true;
    return permissionKeys.every(key => hasPermission(key));
  }, [hasPermission, userRole]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionsContext.Provider value={{
      permissions,
      loading: loading || authLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshPermissions
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  
  // Provide a safe fallback when context is not available
  if (context === undefined) {
    return {
      permissions: [],
      loading: true,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      refreshPermissions: async () => {}
    };
  }
  return context;
}

// Guard component for permission-based rendering
interface PermissionGuardProps {
  permission: string | string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  mode = 'any', 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  
  let hasAccess: boolean;
  if (permissions.length === 1) {
    hasAccess = hasPermission(permissions[0]);
  } else if (mode === 'all') {
    hasAccess = hasAllPermissions(permissions);
  } else {
    hasAccess = hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// HOC for permission-based access
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string | string[],
  mode: 'any' | 'all' = 'any'
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard permission={requiredPermission} mode={mode}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}
