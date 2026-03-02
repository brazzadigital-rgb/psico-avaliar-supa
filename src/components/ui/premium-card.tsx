import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "highlight" | "dark";
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = "default", hover = true, padding = "md", children, ...props }, ref) => {
    const paddingClasses = {
      sm: "p-5 md:p-6",
      md: "p-6 md:p-8",
      lg: "p-8 md:p-10 lg:p-12",
    };

    const variantClasses = {
      default: "card-premium",
      glass: "glass-card",
      highlight: "card-premium ring-2 ring-accent shadow-xl",
      dark: "bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          hover && variant !== "dark" && "hover-lift",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PremiumCard.displayName = "PremiumCard";

interface IconBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "accent" | "gradient" | "muted";
}

const IconBox = React.forwardRef<HTMLDivElement, IconBoxProps>(
  ({ className, icon: Icon, size = "md", variant = "gradient", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-12 h-12 rounded-xl",
      md: "w-16 h-16 rounded-2xl",
      lg: "w-20 h-20 rounded-3xl",
    };

    const iconSizes = {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-10 h-10",
    };

    const variantClasses = {
      primary: "bg-primary/10",
      accent: "bg-accent/10",
      gradient: "bg-gradient-to-br from-primary/10 to-accent/10",
      muted: "bg-muted",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center transition-all duration-500 group-hover:scale-110",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Icon className={cn(iconSizes[size], "text-primary")} />
      </div>
    );
  }
);
IconBox.displayName = "IconBox";

interface FeatureListProps {
  features: string[];
  variant?: "check" | "dot" | "number";
  className?: string;
}

const FeatureList = ({ features, variant = "dot", className }: FeatureListProps) => {
  return (
    <ul className={cn("space-y-3", className)}>
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3 text-sm">
          {variant === "dot" && (
            <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
          )}
          {variant === "check" && (
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {variant === "number" && (
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-accent">{index + 1}</span>
            </div>
          )}
          <span className="text-muted-foreground">{feature}</span>
        </li>
      ))}
    </ul>
  );
};
FeatureList.displayName = "FeatureList";

export { PremiumCard, IconBox, FeatureList };
