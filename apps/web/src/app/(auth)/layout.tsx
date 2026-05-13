import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold text-lg mb-4">
            YN
          </div>
          <h1 className="text-2xl font-bold">YieldNest</h1>
          <p className="text-[var(--color-muted)] mt-1">Enterprise Stablecoin Yield</p>
        </div>
        {children}
      </div>
    </div>
  );
}
