import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns the professional_id linked to the current user (if role is professional).
 * Admin/receptionist get null (they see everything).
 */
export function useProfessionalId() {
  const { user, userRole } = useAuth();

  const { data: professionalId, isLoading } = useQuery({
    queryKey: ["my-professional-id", user?.id],
    enabled: !!user && userRole === "professional",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching professional id:", error);
        return null;
      }
      return data?.id ?? null;
    },
  });

  // Only filter if role is professional
  if (userRole !== "professional") {
    return { professionalId: null, isProfessional: false, isLoading: false };
  }

  return {
    professionalId: professionalId ?? null,
    isProfessional: true,
    isLoading,
  };
}
