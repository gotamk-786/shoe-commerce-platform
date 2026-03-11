"use client";

import dynamic from "next/dynamic";

const AddressPickerMap = dynamic(() => import("./address-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-[24px] border border-black/10 bg-white text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

type Props = {
  lat?: number;
  lng?: number;
  onMarkerChange: (coords: { lat: number; lng: number }) => void;
  onUseCurrentLocation: () => void;
  locationLoading?: boolean;
};

export default function AddressPicker({
  lat,
  lng,
  onMarkerChange,
  onUseCurrentLocation,
  locationLoading,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-gray-900">Pin delivery location</label>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={locationLoading}
            className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-gray-800"
          >
            {locationLoading ? "Locating..." : "Use My Current Location"}
          </button>
        </div>
      </div>

      <AddressPickerMap lat={lat} lng={lng} onChange={onMarkerChange} />
      <p className="text-xs text-gray-500">
        Use current location, click the map, or type the full address below to place the delivery pin.
      </p>
    </div>
  );
}
