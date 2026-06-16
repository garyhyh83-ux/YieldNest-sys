import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "accent" | "vault" | "gold";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-40",
          // Default — navy fill
          variant === "default" &&
            "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold hover:bg-[var(--color-primary-hover)] active:scale-[0.97] shadow-[var(--shadow-soft)]",
          // Gold fill — for primary CTAs
          variant === "gold" &&
            "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold hover:bg-[color-mix(in_srgb,var(--color-accent)90%,white)] active:scale-[0.97] shadow-[var(--shadow-gold)]",
          // Outline — clean border
          variant === "outline" &&
            "border border-[var(--color-border)] bg-white text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)]/3 shadow-sm",
          // Ghost — whisper
          variant === "ghost" &&
            "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-foreground)]/5",
          // Link — gold underline
          variant === "link" &&
            "text-[var(--color-accent)] underline-offset-4 hover:underline p-0 h-auto font-medium",
          // Accent — blue
          variant === "accent" &&
            "bg-[var(--color-accent-blue)] text-white font-semibold hover:opacity-90 active:scale-[0.97]",
          // Vault — heavy architectural, navy outline
          variant === "vault" &&
            "bg-white border border-[var(--color-border)] text-[var(--color-foreground)] font-mono text-xs tracking-widest uppercase hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/3 active:scale-[0.97] shadow-sm",
          // Sizes
          size === "default" && "h-10 px-5 rounded-lg text-sm",
          size === "sm" && "h-8 px-3.5 rounded-md text-xs",
          size === "lg" && "h-12 px-7 rounded-xl text-base",
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
