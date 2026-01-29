import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-body tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:shadow-[0_0_15px_hsl(var(--destructive)/0.4)]",
        outline: "border border-border bg-background text-foreground hover:border-gold hover:text-gold hover:bg-gold/5 hover:shadow-[0_0_15px_hsl(var(--gold)/0.2)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground",
        ghost: "text-muted-foreground hover:bg-gold/10 hover:text-gold",
        link: "text-gold underline-offset-4 hover:underline hover:text-gold-light",
        // Premium brand variants
        gold: "bg-gradient-to-br from-gold-light via-gold to-gold-dark text-charcoal-deep font-semibold shadow-[0_4px_20px_hsl(var(--gold)/0.3)] hover:shadow-[0_6px_30px_hsl(var(--gold)/0.5)] hover:scale-[1.02] active:scale-[0.98]",
        "gold-outline": "border border-gold text-gold bg-transparent hover:bg-gold/15 hover:shadow-[0_0_20px_hsl(var(--gold)/0.3)] hover:border-gold-light",
        cream: "bg-cream text-charcoal-deep hover:bg-cream-dark hover:shadow-md",
        hero: "bg-gradient-to-br from-gold-light via-gold to-gold-dark text-charcoal-deep font-semibold text-base shadow-[0_4px_25px_hsl(var(--gold)/0.4)] hover:shadow-[0_8px_40px_hsl(var(--gold)/0.6)] hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest",
        "hero-outline": "border-2 border-gold/50 text-gold bg-transparent hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_25px_hsl(var(--gold)/0.3)] uppercase tracking-widest font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
