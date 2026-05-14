import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50",
          // Default: amber gold fill
          variant === "default" &&
            "bg-[var(--color-accent)] text-[#080c14] font-semibold hover:bg-[color-mix(in_srgb,var(--color-accent)90%,white)] active:scale-[0.98] shadow-sm shadow-[var(--color-accent-glow)]",
          // Outline: refined border
          variant === "outline" &&
            "border border-[var(--color-border)] bg-transparent text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)]/5",
          // Ghost: subtle
          variant === "ghost" &&
            "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/[0.04]",
          // Link: amber underline
          variant === "link" &&
            "text-[var(--color-accent)] underline-offset-4 hover:underline p-0 h-auto",
          // Accent: blue alternative
          variant === "accent" &&
            "bg-[var(--color-accent-blue)] text-white font-semibold hover:opacity-90 active:scale-[0.98]",
          // Sizes
          size === "default" && "h-10 px-5 rounded-lg text-sm",
          size === "sm" && "h-8 px-3.5 rounded-md text-xs",
          size === "lg" && "h-12 px-7 rounded-lg text-base",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
