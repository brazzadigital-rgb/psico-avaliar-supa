import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";

interface TimelineItem {
  step?: string | number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  variant?: "vertical" | "horizontal";
  className?: string;
}

const Timeline = ({ items, variant = "vertical", className }: TimelineProps) => {
  if (variant === "horizontal") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        {items.map((item, index) => (
          <ScrollAnimate key={index} animation="fade-up" delay={index * 0.1}>
            <div className="relative group">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 h-full border border-white/10 transition-all duration-500 group-hover:bg-white/15">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
                  {item.icon || (
                    <span className="font-bold text-accent-foreground text-lg">
                      {item.step || index + 1}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-semibold text-xl text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-white/70">{item.description}</p>
              </div>
              
              {/* Connector line */}
              {index < items.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-white/20" />
              )}
            </div>
          </ScrollAnimate>
        ))}
      </div>
    );
  }

  // Vertical timeline
  return (
    <div className={cn("relative", className)}>
      {/* Central line */}
      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-12">
        {items.map((item, index) => (
          <ScrollAnimate
            key={index}
            animation={index % 2 === 0 ? "slide-right" : "slide-left"}
            delay={index * 0.15}
          >
            <div className={cn(
              "relative flex items-start gap-6 md:gap-0",
              index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            )}>
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-3 h-3 rounded-full bg-accent ring-4 ring-background z-10" />
              
              {/* Content */}
              <div className={cn(
                "flex-1 pl-12 md:pl-0 md:w-1/2",
                index % 2 === 0 ? "md:pr-12" : "md:pl-12"
              )}>
                <div className="card-premium p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm">
                      {item.step || index + 1}
                    </span>
                    <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          </ScrollAnimate>
        ))}
      </div>
    </div>
  );
};

export { Timeline };
export type { TimelineItem };
