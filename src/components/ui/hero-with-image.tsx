import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface HeroWithImageProps extends React.HTMLAttributes<HTMLElement> {
  badge?: {
    icon?: LucideIcon;
    text: string;
    variant?: "primary" | "accent";
  };
  title: string;
  description?: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  backgroundImage: string;
  overlay?: "light" | "dark" | "gradient";
}

const HeroWithImage = React.forwardRef<HTMLElement, HeroWithImageProps>(
  (
    { 
      className, 
      badge, 
      title, 
      description, 
      children, 
      size = "md",
      align = "left",
      backgroundImage,
      overlay = "gradient",
      ...props 
    }, 
    ref
  ) => {
    const sizeClasses = {
      sm: "pt-28 pb-12 lg:pt-32 lg:pb-16",
      md: "pt-32 pb-20 lg:pt-40 lg:pb-28",
      lg: "pt-36 pb-24 lg:pt-44 lg:pb-32",
    };

    const overlayClasses = {
      light: "bg-white/70 backdrop-blur-sm",
      dark: "bg-black/50",
      gradient: "bg-gradient-to-r from-background/95 via-background/80 to-background/40",
    };

    return (
      <section
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        
        {/* Overlay */}
        <div className={cn("absolute inset-0", overlayClasses[overlay])} />
        
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        
        <div className="container-wide relative z-10">
          <div className={cn(
            align === "center" ? "max-w-4xl mx-auto text-center" : "max-w-3xl"
          )}>
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6",
                  badge.variant === "accent" 
                    ? "bg-accent/10 text-accent backdrop-blur-sm"
                    : "bg-primary/10 text-primary backdrop-blur-sm"
                )}
              >
                {badge.icon && <badge.icon className="w-4 h-4" />}
                {badge.text}
              </span>
            )}
            
            <h1 className="text-foreground mb-6 animate-fade-in">
              {title}
            </h1>
            
            {description && (
              <p
                className="text-xl text-muted-foreground leading-relaxed animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                {description}
              </p>
            )}
            
            {children && (
              <div
                className={cn(
                  "mt-8 animate-fade-in-up",
                  align === "center" && "flex flex-wrap justify-center gap-4"
                )}
                style={{ animationDelay: "0.2s" }}
              >
                {children}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
);
HeroWithImage.displayName = "HeroWithImage";

export { HeroWithImage };
