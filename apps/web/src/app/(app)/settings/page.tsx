"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Building2, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--color-muted)] mt-1">Manage your account and enterprise profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <Input placeholder="Your Name" defaultValue="" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input disabled value="you@company.com" />
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4" /> Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Legal Name</label>
              <Input placeholder="Your Company, Inc." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Input placeholder="US" maxLength={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Registration Number</label>
              <Input placeholder="Company registration number" />
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>
      </div>

      {/* Passkeys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" /> Passkeys / Security Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[var(--color-muted)] mb-4">
            Passkeys allow you to sign in and approve transactions securely using biometrics.
          </div>
          <div className="border border-dashed border-[var(--color-border)] rounded-lg p-8 text-center">
            <p className="text-[var(--color-muted)] text-sm">No passkeys registered yet.</p>
            <Button size="sm" className="mt-2">Register Passkey</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
