"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Mail, Loader2, FlaskConical } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginComplete, demoLogin } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "passkey" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email);
      if (result.method === "passkey") {
        setStep("passkey");
        try {
          const assertion = await navigator.credentials.get({
            publicKey: result.options,
          });
          await loginComplete(email, {
            id: (assertion as any).id,
            rawId: btoa(String.fromCharCode(...new Uint8Array((assertion as any).rawId))),
            response: {
              authenticatorData: btoa(String.fromCharCode(...new Uint8Array((assertion as any).response.authenticatorData))),
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((assertion as any).response.clientDataJSON))),
              signature: btoa(String.fromCharCode(...new Uint8Array((assertion as any).response.signature))),
            },
            type: "public-key",
            clientExtensionResults: {},
          });
          toast.success(t("login.success"));
          router.push("/dashboard");
        } catch {
          toast.error(t("login.passkeyFailed"));
          setStep("otp");
        }
      } else if (result.method === "otp") {
        setStep("otp");
        toast.success(t("login.otpSent"));
      }
    } catch (err: any) {
      toast.error(err.message || t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginComplete(email, undefined, otp);
      toast.success(t("login.success"));
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || t("login.invalidOtp"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{t("login.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("login.email")}</label>
              <Input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              {t("login.continuePasskey")}
            </Button>
          </form>
        )}

        {step === "passkey" && (
          <div className="text-center space-y-4">
            <KeyRound className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-muted)]">
              {t("login.passkeyPrompt")}
            </p>
            <Button variant="outline" className="w-full" onClick={() => setStep("otp")}>
              <Mail className="w-4 h-4 mr-2" />
              {t("login.useOtp")}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-muted)] text-center">
              {t("login.otpPrompt", { email })}
            </p>
            <Input
              type="text"
              maxLength={6}
              placeholder={t("login.otpPlaceholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t("login.verifyOtp")}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>
              {t("login.back")}
            </Button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
          <button
            type="button"
            onClick={() => {
              demoLogin();
              toast.success(t("login.demoSuccess"));
              router.push("/dashboard");
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-yellow-400/40 text-yellow-400/80 hover:bg-yellow-400/5 hover:border-yellow-400/60 hover:text-yellow-400 transition-colors text-sm font-medium"
          >
            <FlaskConical className="w-4 h-4" />
            {t("login.demoLabel")}
          </button>
          <p className="text-[10px] text-[var(--color-muted)] text-center">
            {t("login.demoHint")}
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-[var(--color-muted)]">
          <a href="/register" className="text-[var(--color-accent)] hover:underline">
            {t("login.createAccount")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
