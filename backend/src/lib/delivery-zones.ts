type Point = {
  lat: number;
  lng: number;
};

type PolygonPoint = [number, number] | { lat: number; lng: number };

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineKm = (from: Point, to: Point) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

const normalizePolygon = (
  raw: unknown,
  format: "lng-lat" | "lat-lng" = "lng-lat",
): Array<[number, number]> => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const first = Number(point[0]);
        const second = Number(point[1]);
        return format === "lng-lat"
          ? ([first, second] as [number, number])
          : ([second, first] as [number, number]);
      }

      if (
        point &&
        typeof point === "object" &&
        "lat" in point &&
        "lng" in point
      ) {
        const candidate = point as { lat: number; lng: number };
        return [Number(candidate.lng), Number(candidate.lat)] as [number, number];
      }

      return null;
    })
    .filter((point): point is [number, number] => Boolean(point));
};

const isInsidePolygon = (point: Point, polygon: Array<[number, number]>) => {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

export type DeliveryZoneRecord = {
  id: string;
  name: string;
  city: string;
  coverageType: "radius" | "polygon";
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  polygonJson: unknown;
  shippingFee: number;
  estimatedDeliveryTime: string;
  codAvailable: boolean;
  isActive: boolean;
};

export type DeliveryZoneMatch = {
  zone: DeliveryZoneRecord;
  distanceKm?: number;
};

const normalizeText = (value?: string | null) => value?.trim().toLowerCase() || "";

export const findNationwideZone = (
  zones: DeliveryZoneRecord[],
): DeliveryZoneRecord | null => {
  const nationwideMarkers = ["pakistan", "all pakistan", "nationwide", "all over pakistan"];

  return (
    zones.find((zone) => {
      if (!zone.isActive) return false;
      const city = normalizeText(zone.city);
      const name = normalizeText(zone.name);
      return nationwideMarkers.includes(city) || nationwideMarkers.includes(name);
    }) ?? null
  );
};

export const findMatchingZone = (
  zones: DeliveryZoneRecord[],
  point: Point,
): DeliveryZoneMatch | null => {
  const activeZones = zones.filter((zone) => zone.isActive);
  const radiusToleranceKm = 0.35;

  for (const zone of activeZones) {
    if (
      zone.coverageType === "radius" &&
      zone.centerLat !== null &&
      zone.centerLng !== null &&
      zone.radiusKm !== null
    ) {
      const distanceKm = haversineKm(point, {
        lat: zone.centerLat,
        lng: zone.centerLng,
      });

      if (distanceKm <= zone.radiusKm + radiusToleranceKm) {
        return { zone, distanceKm };
      }
    }

    if (zone.coverageType === "polygon") {
      const polygonLngLat = normalizePolygon(zone.polygonJson, "lng-lat");
      const polygonLatLng = normalizePolygon(zone.polygonJson, "lat-lng");
      if (
        isInsidePolygon(point, polygonLngLat) ||
        isInsidePolygon(point, polygonLatLng)
      ) {
        return { zone };
      }
    }
  }

  return null;
};
