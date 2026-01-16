"use client";

import { useEffect, useState } from "react";
import TableShell from "@/components/admin/widgets/table-shell";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import { adminFetchOrders, adminUpdateOrderStatus, handleApiError } from "@/lib/api";
import { AdminOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const statusOptions: AdminOrder["status"][] = [
  "processing",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    setStatus({ loading: true, error: "" });
    adminFetchOrders()
      .then((data) => {
        setOrders(data);
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        setStatus({ loading: false, error: handleApiError(error) });
      });
  }, []);

  const updateStatus = async (orderId: string, nextStatus: AdminOrder["status"]) => {
    try {
      setStatus({ loading: true, error: "" });
      await adminUpdateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
      );
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="Operations"
        title="Orders"
        description="Track and update order fulfillment."
      />
      <TableShell title="Orders list" headers={["Order", "Customer", "Total", "Status", "Placed", "Action"]}>
        {orders.map((order) => (
          <tr key={order.id} className="text-sm text-white/80">
            <td className="py-3">{order.id}</td>
            <td>
              <p className="text-white">{order.customer.name}</p>
              <p className="text-xs text-white/60">{order.customer.email}</p>
            </td>
            <td>{formatCurrency(order.total)}</td>
            <td>
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value as AdminOrder["status"])}
                className="rounded-lg border border-white/20 bg-white text-sm text-gray-900 px-3 py-2"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="text-gray-900">
                    {s}
                  </option>
                ))}
              </select>
            </td>
            <td>{new Date(order.placedAt).toLocaleDateString()}</td>
            <td className="flex items-center gap-2">
              <Button
                className="text-xs"
                variant="ghost"
                onClick={() => (window.location.href = `/admin/orders/${order.id}`)}
              >
                Track
              </Button>
            </td>
          </tr>
        ))}
        {!orders.length && (
          <tr className="text-sm text-white/60">
            <td className="py-3" colSpan={6}>
              {status.loading ? "Loading orders..." : "No orders yet."}
            </td>
          </tr>
        )}
      </TableShell>
      {status.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {status.error}
        </div>
      )}
    </div>
  );
}

