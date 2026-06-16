import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 py-2 font-mono text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/50 transition-all duration-200",
          "hover:border-[var(--color-border-light)]",
          "focus:border-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--color-border)] disabled:bg-[var(--color-elevated)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--color-foreground)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
