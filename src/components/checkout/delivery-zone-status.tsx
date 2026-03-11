"use client";

import { DeliveryZoneQuote } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type Props = {
  status: DeliveryZoneQuote | null;
  loading?: boolean;
  error?: string;
};

export default function DeliveryZoneStatus({ status, loading, error }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-600">
        Checking delivery coverage...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (!status.available || !status.zone) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {status.message || "Delivery not available in this area."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">{status.zone.name}</span>
        <span>Shipping: {status.zone.shippingFee === 0 ? "Free" : formatCurrency(status.zone.shippingFee)}</span>
        <span>ETA: {status.zone.estimatedDeliveryTime}</span>
        <span>{status.zone.codAvailable ? "COD available" : "COD unavailable"}</span>
      </div>
    </div>
  );
}
