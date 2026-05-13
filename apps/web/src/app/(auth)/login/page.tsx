"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginComplete } = useAuth();
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
        // Trigger passkey authentication
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
          toast.success("Logged in successfully");
          router.push("/dashboard");
        } catch (passkeyErr) {
          toast.error("Passkey authentication failed. Try OTP instead.");
          setStep("otp");
        }
      } else if (result.method === "otp") {
        setStep("otp");
        toast.success("OTP sent to your email");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginComplete(email, undefined, otp);
      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Continue with Passkey
            </Button>
          </form>
        )}

        {step === "passkey" && (
          <div className="text-center space-y-4">
            <KeyRound className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-muted)]">
              Follow your browser's prompt to authenticate with your passkey.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setStep("otp")}>
              <Mail className="w-4 h-4 mr-2" />
              Use OTP instead
            </Button>
          </div>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-muted)] text-center">
              Enter the 6-digit code sent to {email}
            </p>
            <Input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify OTP
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>
              Back
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
          <a href="/register" className="text-[var(--color-accent)] hover:underline">
            Create new account
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
