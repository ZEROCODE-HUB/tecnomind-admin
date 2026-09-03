import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  rightLabel?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, rightLabel, className, ...props }, ref) => {
    return (
      <label className="flex flex-col w-full gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-sm font-medium">{label}</span>
          {rightLabel}
        </div>
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl text-foreground border border-border bg-muted/50",
              "focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none",
              "h-12 min-h-[44px] text-base placeholder:text-muted-foreground transition-all shadow-sm",
              Icon ? "pl-11 pr-4" : "px-4",
              className
            )}
            {...props}
          />
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </label>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
