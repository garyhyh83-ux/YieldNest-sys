"use client";

import { useState } from "react";
import { useLocale } from "@/providers/locale-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Building2, Shield, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { t } = useLocale();
  const [kybStatus, setKybStatus] = useState<"pending" | "approved">("pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-[var(--color-muted)] mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" /> {t("settings.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("settings.displayName")}</label>
              <Input placeholder={t("settings.displayNamePlaceholder")} defaultValue="" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("settings.email")}</label>
              <Input disabled value="admin@acmecorp.com" />
            </div>
            <Button size="sm">{t("settings.saveChanges")}</Button>
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4" /> {t("settings.enterprise")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("settings.legalName")}</label>
              <Input placeholder={t("settings.legalNamePlaceholder")} defaultValue="Acme Corporation" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("settings.country")}</label>
              <Input placeholder={t("settings.countryPlaceholder")} maxLength={2} defaultValue="US" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("settings.registrationNumber")}</label>
              <Input placeholder={t("settings.registrationPlaceholder")} defaultValue="REG-12345678" />
            </div>
            <Button size="sm">{t("settings.saveChanges")}</Button>
          </CardContent>
        </Card>
      </div>

      {/* KYB */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" /> {t("settings.kyb")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.kybStatus")}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {kybStatus === "approved"
                  ? "Your enterprise is fully verified"
                  : "Submit documents to enable full platform access"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              kybStatus === "approved"
                ? "bg-green-400/10 text-green-400"
                : "bg-yellow-400/10 text-yellow-400"
            }`}>
              {kybStatus === "approved" ? t("settings.kybStatusApproved") : t("settings.kybStatusPending")}
            </span>
          </div>
          {kybStatus !== "approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setKybStatus("approved");
                toast.success(t("settings.kybApprovedToast"));
              }}
            >
              {t("settings.kybSubmit")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" /> {t("settings.passkeys")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            Passkeys allow you to sign in and approve transactions securely using biometrics.
          </p>
          <div className="border border-dashed border-[var(--color-border)] rounded-lg p-8 text-center">
            <p className="text-[var(--color-muted)] text-sm">{t("settings.noPasskeys")}</p>
            <Button size="sm" className="mt-2">{t("settings.registerPasskey")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
