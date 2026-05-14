"use client";

import { type ReactNode } from "react";
import { Web3Provider } from "@/providers/web3-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { LocaleProvider, useLocale } from "@/providers/locale-provider";
import { Toaster } from "sonner";

function HtmlWrapper({ children, fontClassName }: { children: ReactNode; fontClassName: string }) {
  const { locale } = useLocale();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className={`dark ${fontClassName}`}>
      <body className="font-sans antialiased min-h-screen text-[var(--color-foreground)]">
        {children}
      </body>
    </html>
  );
}

export function AppProviders({ children, fontClassName }: { children: ReactNode; fontClassName: string }) {
  return (
    <LocaleProvider>
      <HtmlWrapper fontClassName={fontClassName}>
        <Web3Provider>
          <AuthProvider>
            {children}
            <Toaster richColors />
          </AuthProvider>
        </Web3Provider>
      </HtmlWrapper>
    </LocaleProvider>
  );
}
