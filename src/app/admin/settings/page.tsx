"use client";

import SectionHeading from "@/components/ui/section-heading";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useEffect, useState } from "react";
import { fetchPaymentSettings, handleApiError, updatePaymentSettings } from "@/lib/api";

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [password, setPassword] = useState({ current: "", next: "" });
  const [paymentSettings, setPaymentSettings] = useState({
    paymentRequired: false,
    allowCod: true,
    allowDummy: true,
  });
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });

  useEffect(() => {
    fetchPaymentSettings()
      .then((data) => setPaymentSettings(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="Settings"
        title="Admin preferences"
        description="Update profile, change password, and manage session."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="text-sm font-semibold">Profile</p>
          <div className="mt-4 space-y-3">
            <Input
              label="Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <Button variant="primary">Save profile</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="text-sm font-semibold">Change password</p>
          <div className="mt-4 space-y-3">
            <Input
              label="Current password"
              type="password"
              value={password.current}
              onChange={(e) => setPassword({ ...password, current: e.target.value })}
            />
            <Input
              label="New password"
              type="password"
              value={password.next}
              onChange={(e) => setPassword({ ...password, next: e.target.value })}
            />
            <Button variant="primary">Update password</Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="text-sm font-semibold">Checkout controls</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80">
            <span>Require payment before order</span>
            <input
              type="checkbox"
              checked={paymentSettings.paymentRequired}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, paymentRequired: e.target.checked }))
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80">
            <span>Allow cash on delivery</span>
            <input
              type="checkbox"
              checked={paymentSettings.allowCod}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, allowCod: e.target.checked }))
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80">
            <span>Allow dummy test payments</span>
            <input
              type="checkbox"
              checked={paymentSettings.allowDummy}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, allowDummy: e.target.checked }))
              }
            />
          </label>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                setStatus({ loading: true });
                await updatePaymentSettings(paymentSettings);
                setStatus({ loading: false });
              } catch (err) {
                setStatus({ loading: false, error: handleApiError(err) });
              }
            }}
            disabled={status.loading}
          >
            {status.loading ? "Saving..." : "Save checkout settings"}
          </Button>
          {status.error && <p className="text-sm text-rose-300">{status.error}</p>}
        </div>
      </div>
    </div>
  );
}

