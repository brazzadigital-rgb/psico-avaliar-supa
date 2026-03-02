import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "muted" | "primary" | "gradient";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "py-12 md:py-16",
      md: "py-16 md:py-24 lg:py-28",
      lg: "py-20 md:py-28 lg:py-36",
    };

    const variantClasses = {
      default: "bg-background",
      muted: "bg-secondary/30",
      primary: "bg-primary text-primary-foreground",
      gradient: "relative bg-gradient-to-br from-primary via-primary to-accent overflow-hidden",
    };

    return (
      <section
        ref={ref}
        className={cn(sizeClasses[size], variantClasses[variant], className)}
        {...props}
      >
        {variant === "gradient" && (
          <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-float-slow" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/20 blur-3xl animate-float-delayed" />
            </div>
          </>
        )}
        {children}
      </section>
    );
  }
);
Section.displayName = "Section";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, badge, title, description, align = "center", light = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mb-12 md:mb-16",
          align === "center" && "text-center",
          className
        )}
        {...props}
      >
        {badge && (
          <span
            className={cn(
              "inline-block font-medium text-sm tracking-wider uppercase mb-4",
              light ? "text-accent" : "text-accent"
            )}
          >
            {badge}
          </span>
        )}
        <h2
          className={cn(
            "mb-4",
            light ? "text-white" : "text-foreground"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "text-lg max-w-2xl",
              align === "center" && "mx-auto",
              light ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

export { Section, SectionHeader };
