import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULTS = {
  phone: "(51) 99280-9471",
  phoneDigits: "51992809471",
  message: "Olá! Gostaria de mais informações.",
};

export function useWhatsApp() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings-whatsapp-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["general", "whatsapp"]);
      if (error) return null;
      const map: Record<string, any> = {};
      data?.forEach((item: any) => {
        map[item.key] = item.value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const phone = settings?.general?.phone || DEFAULTS.phone;
  const phoneDigits = phone.replace(/\D/g, "");
  const defaultMessage = settings?.whatsapp?.default_message || DEFAULTS.message;

  /** Build a full wa.me URL with optional custom message */
  const getWhatsAppUrl = (customMessage?: string) => {
    const msg = customMessage || defaultMessage;
    return `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(msg)}`;
  };

  /** Formatted phone for display, e.g. "(51) 99280-9471" */
  const formattedPhone = phone;

  return { getWhatsAppUrl, phoneDigits, formattedPhone, defaultMessage };
}
