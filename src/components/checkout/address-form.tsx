"use client";

import Input from "@/components/ui/input";
import { DeliveryAddressInput, DeliveryZoneQuote, GeocodedAddressSuggestion } from "@/lib/types";
import AddressPicker from "./address-picker";
import DeliveryZoneStatus from "./delivery-zone-status";

export type DeliveryAddressDraft = Omit<DeliveryAddressInput, "lat" | "lng"> & {
  lat?: number;
  lng?: number;
};

type Props = {
  value: DeliveryAddressDraft;
  suggestions: GeocodedAddressSuggestion[];
  suggestionLoading: boolean;
  suggestionError?: string;
  zoneStatus: DeliveryZoneQuote | null;
  zoneLoading?: boolean;
  zoneError?: string;
  saveForLater: boolean;
  editMode?: boolean;
  onChange: (patch: Partial<DeliveryAddressDraft>) => void;
  onSuggestionInputChange: (value: string) => void;
  onSuggestionSelect: (suggestion: GeocodedAddressSuggestion) => void;
  onMarkerChange: (coords: { lat: number; lng: number }) => void;
  onSaveForLaterChange: (value: boolean) => void;
};

const labelOptions: Array<DeliveryAddressDraft["label"]> = ["Home", "Office", "Other"];

export default function AddressForm({
  value,
  suggestions,
  suggestionLoading,
  suggestionError,
  zoneStatus,
  zoneLoading,
  zoneError,
  saveForLater,
  editMode,
  onChange,
  onSuggestionInputChange,
  onSuggestionSelect,
  onMarkerChange,
  onSaveForLaterChange,
}: Props) {
  return (
    <div className="space-y-5">
      <AddressPicker
        lat={value.lat}
        lng={value.lng}
        onMarkerChange={onMarkerChange}
      />

      <DeliveryZoneStatus status={zoneStatus} loading={zoneLoading} error={zoneError} />

      <div className="space-y-2">
        <Input
          label="Full address"
          required
          value={value.fullAddress}
          onChange={(event) => {
            onChange({ fullAddress: event.target.value });
            onSuggestionInputChange(event.target.value);
          }}
          placeholder="House no, street, block, sector, landmark"
        />
        {suggestionLoading ? <p className="text-xs text-gray-500">Searching addresses...</p> : null}
        {suggestionError ? <p className="text-xs text-amber-700">{suggestionError}</p> : null}
        {value.fullAddress.trim().length >= 3 ? (
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            {suggestions.length > 0 ? (
              <div className="max-h-72 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.placeId}-${suggestion.lat}-${suggestion.lng}`}
                    type="button"
                    onClick={() => onSuggestionSelect(suggestion)}
                    className="block w-full border-b border-black/5 px-4 py-3 text-left text-sm text-gray-700 transition last:border-b-0 hover:bg-slate-50"
                  >
                    {suggestion.fullAddress}
                  </button>
                ))}
              </div>
            ) : !suggestionLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">No suggestions found.</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Full name"
          required
          value={value.fullName}
          onChange={(event) => onChange({ fullName: event.target.value })}
        />
        <Input
          label="Email"
          type="email"
          required
          value={value.email}
          onChange={(event) => onChange({ email: event.target.value })}
        />
        <Input
          label="Phone number"
          required
          value={value.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          placeholder="03xx xxxxxxx"
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-900">Address label</span>
          <div className="flex flex-wrap gap-2">
            {labelOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ label: option })}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  value.label === option
                    ? "bg-black text-white"
                    : "border border-black/10 bg-white text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="House / Flat / Apartment / Floor"
          value={value.houseNo || ""}
          onChange={(event) => onChange({ houseNo: event.target.value })}
        />
        <Input
          label="Street / Block / Sector"
          required
          value={value.street}
          onChange={(event) => onChange({ street: event.target.value })}
        />
        <Input
          label="Landmark"
          value={value.landmark || ""}
          onChange={(event) => onChange({ landmark: event.target.value })}
        />
        <Input
          label="Area"
          value={value.area || ""}
          onChange={(event) => onChange({ area: event.target.value })}
        />
        <Input
          label="City"
          required
          value={value.city}
          onChange={(event) => onChange({ city: event.target.value })}
        />
        <Input
          label="State / Province"
          value={value.state || ""}
          onChange={(event) => onChange({ state: event.target.value })}
        />
        <Input
          label="Postal code"
          value={value.postalCode || ""}
          onChange={(event) => onChange({ postalCode: event.target.value })}
        />
        <Input
          label="Country"
          required
          value={value.country}
          onChange={(event) => onChange({ country: event.target.value })}
        />
      </div>

      <label className="flex flex-col gap-2 text-sm text-gray-700">
        <span className="text-sm font-medium text-gray-900">Delivery notes</span>
        <textarea
          value={value.deliveryNotes || ""}
          onChange={(event) => onChange({ deliveryNotes: event.target.value })}
          rows={4}
          placeholder="Delivery timing, gate number, or rider instructions"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none transition focus:border-black/30"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={saveForLater}
          onChange={(event) => onSaveForLaterChange(event.target.checked)}
        />
        {editMode ? "Update this saved address" : "Save this address for next checkout"}
      </label>
    </div>
  );
}
