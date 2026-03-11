"use client";

import { Address } from "@/lib/types";

type Props = {
  addresses: Address[];
  selectedId?: string;
  busyId?: string;
  onSelect: (address: Address) => void;
  onSetDefault: (address: Address) => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
};

export default function SavedAddressList({
  addresses,
  selectedId,
  busyId,
  onSelect,
  onSetDefault,
  onEdit,
  onDelete,
}: Props) {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {addresses.map((address) => {
        const isSelected = selectedId === address.id;
        const details = [
          address.houseNo,
          address.street,
          address.area,
          address.city,
          address.postalCode || address.zip,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");

        return (
          <div
            key={address.id}
            className={`rounded-2xl border px-4 py-4 transition ${
              isSelected ? "border-black bg-black text-white" : "border-black/10 bg-white text-gray-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    isSelected ? "border-white bg-white text-black" : "border-black/20 text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? "v" : ""}
                </span>
                <div>
                  <p className="text-sm font-semibold">{address.label || "Saved address"}</p>
                  <p className={`mt-1 text-sm ${isSelected ? "text-white/85" : "text-gray-600"}`}>
                    {address.fullName || "Delivery address"}
                  </p>
                  <p className={`mt-1 text-sm ${isSelected ? "text-white/80" : "text-gray-600"}`}>{details}</p>
                  <p className={`text-xs ${isSelected ? "text-white/70" : "text-gray-500"}`}>{address.phone}</p>
                </div>
              </div>
              {address.isDefault ? (
                <span
                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                    isSelected ? "bg-white/15 text-white" : "bg-black/5 text-gray-600"
                  }`}
                >
                  Default
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelect(address)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  isSelected ? "bg-white text-black" : "border border-black/10 bg-white text-gray-800"
                }`}
              >
                {isSelected ? "Selected" : "Select"}
              </button>
              {!address.isDefault ? (
                <button
                  type="button"
                  onClick={() => onSetDefault(address)}
                  disabled={busyId === address.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    isSelected ? "border-white/20 text-white" : "border-black/10 text-gray-700"
                  }`}
                >
                  {busyId === address.id ? "Saving..." : "Set default"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onEdit(address)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  isSelected ? "border-white/20 text-white" : "border-black/10 text-gray-700"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(address)}
                disabled={busyId === address.id}
                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
              >
                {busyId === address.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
