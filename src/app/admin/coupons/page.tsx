"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeading from "@/components/ui/section-heading";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import TableShell from "@/components/admin/widgets/table-shell";
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminFetchCoupons,
  adminUpdateCoupon,
  handleApiError,
} from "@/lib/api";
import { Coupon } from "@/lib/types";

type FormState = {
  code: string;
  type: "percent" | "flat";
  value: string;
  usageLimit: string;
  expiresAt: string;
  active: boolean;
};

const emptyForm: FormState = {
  code: "",
  type: "percent",
  value: "",
  usageLimit: "",
  expiresAt: "",
  active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState({ loading: true, error: "" });

  const refreshCoupons = async () => {
    const data = await adminFetchCoupons();
    setCoupons(data);
  };

  useEffect(() => {
    let active = true;
    adminFetchCoupons()
      .then((data) => {
        if (!active) return;
        setCoupons(data);
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        if (!active) return;
        setStatus({ loading: false, error: handleApiError(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (!form.code || !form.value) {
      setStatus({ loading: false, error: "Code and value are required." });
      return;
    }
    const value = Number(form.value);
    const usageLimit = form.usageLimit ? Number(form.usageLimit) : undefined;
    const expiresAt = form.expiresAt
      ? new Date(`${form.expiresAt}T00:00:00Z`).toISOString()
      : undefined;
    try {
      setStatus({ loading: true, error: "" });
      if (editingId) {
        await adminUpdateCoupon(editingId, {
          code: form.code,
          type: form.type,
          value,
          usageLimit,
          expiresAt,
          active: form.active,
        });
      } else {
        await adminCreateCoupon({
          code: form.code,
          type: form.type,
          value,
          usageLimit,
          expiresAt,
          active: form.active,
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      await refreshCoupons();
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  const discountLabel = useMemo(() => (form.type === "percent" ? "%" : "flat"), [form.type]);

  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="Admin"
        title="Coupons"
        description="Create and manage promotional discounts."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="text-sm font-semibold text-white">
            {editingId ? "Edit coupon" : "Create coupon"}
          </p>
          <div className="mt-4 grid gap-4">
            <Input
              label="Code"
              labelClassName="text-white"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="WELCOME10"
              className="uppercase"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex w-full flex-col gap-2 text-sm text-gray-700">
                <span className="text-sm font-medium text-white">Type</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as FormState["type"] }))
                  }
                >
                  <option value="percent" className="text-gray-900">Percent</option>
                  <option value="flat" className="text-gray-900">Flat</option>
                </select>
              </label>
              <Input
                label={`Value (${discountLabel})`}
                labelClassName="text-white"
                type="number"
                min="1"
                value={form.value}
                onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Usage limit (optional)"
                labelClassName="text-white"
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
              />
              <Input
                label="Expires on (optional)"
                labelClassName="text-white"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSubmit} disabled={status.loading}>
                {status.loading ? "Saving..." : editingId ? "Update coupon" : "Create coupon"}
              </Button>
              {editingId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
            {status.error && <p className="text-sm text-rose-300">{status.error}</p>}
          </div>
        </div>

        <TableShell
          title="All coupons"
          headers={["Code", "Type", "Value", "Used", "Limit", "Expires", "Active", "Actions"]}
        >
          {coupons.map((coupon) => (
            <tr key={coupon.id} className="text-sm text-white/80">
              <td className="py-3 font-semibold">{coupon.code}</td>
              <td>{coupon.type}</td>
              <td>{coupon.value}</td>
              <td>{coupon.usedCount}</td>
              <td>{coupon.usageLimit ?? "-"}</td>
              <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "-"}</td>
              <td>{coupon.active ? "Yes" : "No"}</td>
              <td className="flex items-center gap-2 py-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(coupon.id);
                    setForm({
                      code: coupon.code,
                      type: coupon.type,
                      value: String(coupon.value),
                      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
                      expiresAt: coupon.expiresAt
                        ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
                        : "",
                      active: coupon.active,
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await adminDeleteCoupon(coupon.id);
                    await refreshCoupons();
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {!coupons.length && (
            <tr className="text-sm text-white/60">
              <td className="py-3" colSpan={8}>
                {status.loading ? "Loading coupons..." : "No coupons yet."}
              </td>
            </tr>
          )}
        </TableShell>
      </div>
    </div>
  );
}

