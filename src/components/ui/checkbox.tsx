import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center justify-center cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4.5 w-4.5 rounded border border-slate-300 bg-white transition-all peer-checked:border-[#0F1E36] peer-checked:bg-[#0F1E36] peer-focus-visible:ring-2 peer-focus-visible:ring-[#C5A059] peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center justify-center shadow-xs",
            className
          )}
        >
          <Check
            className={cn(
              "h-3 w-3 stroke-[3] text-white transition-transform transform scale-0",
              checked && "scale-100"
            )}
          />
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
