"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";
import Skeleton from "@/components/ui/skeleton";
import { fetchOrderById, handleApiError } from "@/lib/api";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { buildTrackingUrl } from "@/lib/tracking";
import { useAppSelector } from "@/store/hooks";

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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const token = useAppSelector((state) => state.user.token);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchOrderById(params.id)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(handleApiError(err));
      });
    return () => {
      active = false;
    };
  }, [params.id, token]);

  const isOrderReady = order?.id === params.id;
  const loading = Boolean(token) && !isOrderReady && !error;

  const activeIndex = useMemo(
    () => (order ? statusSteps.indexOf(order.status) : -1),
    [order],
  );

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">Log in to track orders</p>
        <p className="mt-2 text-sm text-gray-600">
          Your timeline and order details will appear here.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="primary" onClick={() => (window.location.href = "/login")}>
            Log in
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/register")}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isOrderReady || error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">Order unavailable</p>
        <p className="mt-2 text-sm text-gray-600">
          {error || "We could not fetch this order."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
      <SectionHeading
        eyebrow="Order tracking"
        title={`Order #${order.id}`}
        description={`Placed on ${new Date(order.placedAt).toLocaleDateString()}`}
      />

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
              {buildTrackingUrl(order.courierName, order.trackingNumber, order.trackingUrl) && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    window.open(
                      buildTrackingUrl(order.courierName, order.trackingNumber, order.trackingUrl),
                      "_blank",
                    )
                  }
                >
                  Track on courier
                </Button>
              )}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {order.courierName ? (
                <p>
                  Courier: <span className="font-semibold">{order.courierName}</span>
                </p>
              ) : (
                <p>Courier: Pending</p>
              )}
              {order.trackingNumber ? (
                <p>
                  Tracking ID: <span className="font-semibold">{order.trackingNumber}</span>
                </p>
              ) : (
                <p>Tracking ID: Waiting to be assigned</p>
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
