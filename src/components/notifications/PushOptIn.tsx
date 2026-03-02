import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "push-opt-in-dismissed";
const SESSION_KEY = "push-opt-in-shown-session";

export function PushOptIn() {
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    isLoading,
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if no user
    if (!user) {
      setVisible(false);
      return;
    }

    // Check if permanently dismissed
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already shown this session
    const shownThisSession = sessionStorage.getItem(SESSION_KEY);
    if (shownThisSession) {
      return;
    }

    // Show after 2 seconds if:
    // - Browser supports push
    // - Permission not already granted or denied
    // - Not already subscribed
    const timer = setTimeout(() => {
      const shouldShow = 
        isSupported &&
        permission === "default" &&
        !isSubscribed;
      
      console.log("[PushOptIn] Check:", { isSupported, permission, isSubscribed, shouldShow });
      
      if (shouldShow) {
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isSupported, permission, isSubscribed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleLater = () => {
    setVisible(false);
    // Don't set localStorage - will show again next session
  };

  const handleEnable = async () => {
    await subscribe();
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50",
        "bg-card border border-border rounded-2xl shadow-2xl p-4",
        "animate-in slide-in-from-bottom-4 duration-500"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Ativar Notificações?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Receba lembretes de consultas e atualizações importantes diretamente no seu navegador.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Ativando..." : "Ativar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLater}
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
