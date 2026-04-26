import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // focus-visible (not focus) — keyboard users only see the ring, mouse clicks don't flash
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary:   "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        outline:     "text-foreground border-border",
        // Semantic variants using the new --success / --warning / --info tokens
        success:     "border-[hsl(var(--success))/0.25] bg-[hsl(var(--success))/0.10] text-[hsl(var(--success))]",
        warning:     "border-[hsl(var(--warning))/0.25] bg-[hsl(var(--warning))/0.10] text-[hsl(var(--warning))]",
        info:        "border-[hsl(var(--info))/0.25] bg-[hsl(var(--info))/0.10] text-[hsl(var(--info))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
