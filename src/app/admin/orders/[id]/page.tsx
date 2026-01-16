"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";
import Skeleton from "@/components/ui/skeleton";
import { adminUpdateOrderTracking, fetchOrderById, handleApiError } from "@/lib/api";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { buildTrackingUrl } from "@/lib/tracking";

const statusSteps: Order["status"][] = [
  "processing",
  "paid",
  "shipped",
  "delivered",
];

const statusLabels: Record<Order["status"], string> = {
  processing: "Processing",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [trackingForm, setTrackingForm] = useState({
    courierName: "",
    trackingNumber: "",
    trackingUrl: "",
  });
  const [trackingStatus, setTrackingStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    fetchOrderById(params.id)
      .then((data) => {
        setOrder(data);
        setTrackingForm({
          courierName: data.courierName ?? "",
          trackingNumber: data.trackingNumber ?? "",
          trackingUrl: data.trackingUrl ?? "",
        });
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        setStatus({ loading: false, error: handleApiError(error) });
      });
  }, [params.id]);

  const activeIndex = useMemo(
    () => (order ? statusSteps.indexOf(order.status) : -1),
    [order],
  );

  if (status.loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order || status.error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">Order unavailable</p>
        <p className="mt-2 text-sm text-gray-600">
          {status.error || "We could not fetch this order."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading
          eyebrow="Admin tracking"
          title={`Order #${order.id}`}
          description={`Placed on ${new Date(order.placedAt).toLocaleDateString()}`}
        />
        <Button variant="ghost" onClick={() => (window.location.href = "/admin/orders")}>
          Back to orders
        </Button>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          {statusSteps.map((step, idx) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                idx <= activeIndex
                  ? "bg-black text-white"
                  : "bg-black/5 text-gray-400"
              }`}
            >
              {statusLabels[step]}
            </span>
          ))}
          {order.status === "cancelled" && (
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-rose-600">
              Cancelled
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-gray-500">
                      {item.quantity} x {formatCurrency(item.price)}
                      {item.color ? ` - ${item.color}` : ""}
                      {item.sizeUS || item.sizeEU
                        ? ` - ${item.sizeUS ? `US ${item.sizeUS}` : ""}${
                            item.sizeUS && item.sizeEU ? " / " : ""
                          }${item.sizeEU ? `EU ${item.sizeEU}` : ""}`
                        : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tracking</h3>
              {buildTrackingUrl(
                trackingForm.courierName,
                trackingForm.trackingNumber,
                trackingForm.trackingUrl,
              ) && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    window.open(
                      buildTrackingUrl(
                        trackingForm.courierName,
                        trackingForm.trackingNumber,
                        trackingForm.trackingUrl,
                      ),
                      "_blank",
                    )
                  }
                >
                  Open courier page
                </Button>
              )}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Courier name
                </span>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)]"
                  value={trackingForm.courierName}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({ ...prev, courierName: e.target.value }))
                  }
                  placeholder="TCS / Leopards / M&P"
                />
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Tracking ID
                </span>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)]"
                  value={trackingForm.trackingNumber}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
                  }
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2 text-sm text-gray-700">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Tracking URL (optional)
                </span>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)]"
                  value={trackingForm.trackingUrl}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({ ...prev, trackingUrl: e.target.value }))
                  }
                  placeholder="Paste courier tracking URL"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                disabled={trackingStatus.loading}
                onClick={async () => {
                  try {
                    setTrackingStatus({ loading: true, error: "" });
                    const updated = await adminUpdateOrderTracking(order.id, {
                      courierName: trackingForm.courierName || undefined,
                      trackingNumber: trackingForm.trackingNumber || undefined,
                      trackingUrl: trackingForm.trackingUrl || undefined,
                    });
                    setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
                    setTrackingStatus({ loading: false, error: "" });
                  } catch (error) {
                    setTrackingStatus({ loading: false, error: handleApiError(error) });
                  }
                }}
              >
                {trackingStatus.loading ? "Saving..." : "Save tracking"}
              </Button>
              {trackingStatus.error && (
                <span className="text-sm text-rose-600">{trackingStatus.error}</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subTotal ?? order.total)}</span>
            </div>
            {order.discountTotal ? (
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountTotal)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Complimentary</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
