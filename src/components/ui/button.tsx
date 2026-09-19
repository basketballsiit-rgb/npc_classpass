import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0F1E36] text-white hover:bg-[#172A4D] focus-visible:ring-[#0F1E36]",
        gold:
          "bg-[#C5A059] text-white hover:bg-[#B38F46] focus-visible:ring-[#C5A059] font-semibold shadow-md hover:shadow-lg",
        goldOutline:
          "border border-[#C5A059] text-[#9E7A2B] bg-[#FDFBF7] hover:bg-[#FBF5E6] hover:text-[#7C5F1C]",
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
        dangerOutline:
          "border border-red-200 text-red-700 bg-red-50/60 hover:bg-red-100",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 shadow-none",
        link:
          "text-[#0F1E36] underline-offset-4 hover:underline shadow-none p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
