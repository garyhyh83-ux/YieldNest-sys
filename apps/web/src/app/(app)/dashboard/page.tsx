"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, CalendarDays, Percent } from "lucide-react";

const stats = [
  { label: "Total Assets", value: "$0.00", icon: DollarSign, color: "text-blue-400" },
  { label: "Yesterday's Yield", value: "--", icon: CalendarDays, color: "text-green-400" },
  { label: "Cumulative Yield", value: "--", icon: TrendingUp, color: "text-purple-400" },
  { label: "Current APY", value: "--", icon: Percent, color: "text-yellow-400" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--color-muted)] mt-1">Overview of your enterprise treasury</p>
      </div>

      {/* KYB Banner */}
      <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Complete Your KYB Verification</h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Submit your business documents to unlock deposits, withdrawals, and yield strategies.
            </p>
          </div>
          <a
            href="/settings"
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            Complete KYB
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-muted)]">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Yield Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-lg">
              <p className="text-[var(--color-muted)] text-sm">
                Charts available after first yield cycle
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-lg">
              <p className="text-[var(--color-muted)] text-sm">
                Asset allocation visible after strategy selection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "--", type: "No transactions yet", amount: "--", status: "Complete KYB to start" },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                <div>
                  <p className="text-sm font-medium">{tx.type}</p>
                  <p className="text-xs text-[var(--color-muted)]">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{tx.amount}</p>
                  <p className="text-xs text-[var(--color-muted)]">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
