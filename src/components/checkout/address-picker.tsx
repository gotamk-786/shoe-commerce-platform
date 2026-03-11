"use client";

import dynamic from "next/dynamic";
import { GeocodedAddressSuggestion } from "@/lib/types";

const AddressPickerMap = dynamic(() => import("./address-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-[24px] border border-black/10 bg-white text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

type Props = {
  value: string;
  suggestions: GeocodedAddressSuggestion[];
  loading: boolean;
  error?: string;
  lat?: number;
  lng?: number;
  onValueChange: (value: string) => void;
  onSelectSuggestion: (suggestion: GeocodedAddressSuggestion) => void;
  onMarkerChange: (coords: { lat: number; lng: number }) => void;
  onUseCurrentLocation: () => void;
  locationLoading?: boolean;
};

export default function AddressPicker({
  value,
  suggestions,
  loading,
  error,
  lat,
  lng,
  onValueChange,
  onSelectSuggestion,
  onMarkerChange,
  onUseCurrentLocation,
  locationLoading,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-gray-900">Search delivery address</label>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={locationLoading}
            className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-gray-800"
          >
            {locationLoading ? "Locating..." : "Use My Current Location"}
          </button>
        </div>
        <input
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Search address, block, sector, or landmark"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none transition focus:border-black/30"
        />
        {loading ? <p className="text-xs text-gray-500">Searching addresses...</p> : null}
        {error ? <p className="text-xs text-amber-700">{error}</p> : null}
      </div>

      {value.trim().length >= 3 ? (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          {suggestions.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.placeId}-${suggestion.lat}-${suggestion.lng}`}
                  type="button"
                  onClick={() => onSelectSuggestion(suggestion)}
                  className="block w-full border-b border-black/5 px-4 py-3 text-left text-sm text-gray-700 transition last:border-b-0 hover:bg-slate-50"
                >
                  {suggestion.fullAddress}
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">No suggestions found.</div>
          ) : null}
        </div>
      ) : null}

      {lat !== undefined && lng !== undefined ? (
        <AddressPickerMap lat={lat} lng={lng} onChange={onMarkerChange} />
      ) : (
        <div className="flex h-[400px] items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-white text-sm text-gray-500">
          Search or use your current location to place the map marker.
        </div>
      )}
    </div>
  );
}
