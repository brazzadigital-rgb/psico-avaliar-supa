import * as React from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  label?: string;
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ className, text, label = "Copiado!", ...props }, ref) => {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast({
          title: label,
          description: text,
          duration: 2000,
        });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast({
          title: "Erro ao copiar",
          variant: "destructive",
        });
      }
    };

    return (
      <button
        ref={ref}
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
          "hover:bg-muted text-muted-foreground hover:text-foreground",
          copied && "text-accent",
          className
        )}
        {...props}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    );
  }
);
CopyButton.displayName = "CopyButton";

export { CopyButton };
