import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#8C78EA] text-white shadow-xs",
        secondary:
          "border-transparent bg-[#F3EEFA] text-[#2B244D]",
        gold:
          "border-transparent bg-[#F3EEFA] text-[#7A63E5] border border-[#E8DEF8]",
        outline:
          "text-[#2B244D] border border-[#EAE3F5] bg-white",
        success:
          "border-[#B7EED8] bg-[#EDFBF5] text-[#1E7250] border font-bold",
        warning:
          "border-[#FFE0C2] bg-[#FFF8F0] text-[#FFAB5E] border font-bold",
        danger:
          "border-[#FFCCD5] bg-[#FFF0F3] text-[#FF4D71] border font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
