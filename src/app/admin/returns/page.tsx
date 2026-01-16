"use client";

import { useEffect, useState } from "react";
import TableShell from "@/components/admin/widgets/table-shell";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import { adminFetchReturns, adminUpdateReturn, handleApiError } from "@/lib/api";
import { AdminReturn } from "@/lib/types";

const STATUS_OPTIONS = ["requested", "reviewing", "approved", "rejected"] as const;

export default function AdminReturnsPage() {
  const [items, setItems] = useState<AdminReturn[]>([]);
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });

  useEffect(() => {
    setStatus({ loading: true });
    adminFetchReturns()
      .then((data) => {
        setItems(data);
        setStatus({ loading: false });
      })
      .catch((error) => {
        setStatus({ loading: false, error: handleApiError(error) });
      });
  }, []);

  const updateStatus = async (id: string, nextStatus: string) => {
    try {
      await adminUpdateReturn(id, nextStatus);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="After sales"
        title="Returns & refunds"
        description="Review and resolve return requests."
      />

      {status.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {status.error}
        </div>
      )}

      <TableShell
        title="Return requests"
        headers={["Return", "Order", "Customer", "Reason", "Status", "Action"]}
      >
        {items.map((ret) => (
          <tr key={ret.id} className="text-sm text-white/80">
            <td className="py-3">{ret.id}</td>
            <td>{ret.orderId}</td>
            <td>{ret.customer?.name ?? "Customer"}</td>
            <td className="max-w-[220px] truncate">{ret.reason}</td>
            <td>
              <select
                value={ret.status}
                onChange={(e) => updateStatus(ret.id, e.target.value)}
                className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-gray-900"
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value} className="text-gray-900">
                    {value}
                  </option>
                ))}
              </select>
            </td>
            <td className="space-x-2">
              <Button variant="ghost" className="text-xs" onClick={() => updateStatus(ret.id, "approved")}>
                Approve
              </Button>
              <Button variant="ghost" className="text-xs" onClick={() => updateStatus(ret.id, "rejected")}>
                Reject
              </Button>
            </td>
          </tr>
        ))}
        {!items.length && !status.loading && (
          <tr>
            <td colSpan={6} className="py-6 text-center text-sm text-white/60">
              No return requests yet.
            </td>
          </tr>
        )}
      </TableShell>
    </div>
  );
}

