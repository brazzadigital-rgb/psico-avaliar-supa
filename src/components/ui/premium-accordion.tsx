import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PremiumAccordion = AccordionPrimitive.Root;

const PremiumAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "bg-card rounded-2xl mb-3 overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-md data-[state=open]:shadow-lg data-[state=open]:border-accent/30",
      className
    )}
    {...props}
  />
));
PremiumAccordionItem.displayName = "PremiumAccordionItem";

const PremiumAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between p-5 md:p-6 font-medium text-left transition-all duration-300",
        "hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]]:text-primary",
        className
      )}
      {...props}
    >
      <span className="pr-4">{children}</span>
      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
PremiumAccordionTrigger.displayName = "PremiumAccordionTrigger";

const PremiumAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden transition-all duration-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("px-5 md:px-6 pb-5 md:pb-6 pt-0 text-muted-foreground leading-relaxed", className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
PremiumAccordionContent.displayName = "PremiumAccordionContent";

export { PremiumAccordion, PremiumAccordionItem, PremiumAccordionTrigger, PremiumAccordionContent };
