type RawAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  house_number?: string;
  quarter?: string;
  city_district?: string;
  state_district?: string;
  hamlet?: string;
};

type NominatimSearchResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: RawAddress;
};

export type GeocodedAddress = {
  placeId: string;
  fullAddress: string;
  lat: number;
  lng: number;
  houseNo?: string;
  street: string;
  landmark?: string;
  area?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
};

const NOMINATIM_BASE = process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";

const requestHeaders = () => ({
  "User-Agent": process.env.NOMINATIM_USER_AGENT ?? "ThriftyShoes/1.0 (support@thriftyshoes.vercel.app)",
  Accept: "application/json",
  "Accept-Language": "en",
});

const pickStreet = (address?: RawAddress) =>
  address?.road || address?.pedestrian || address?.footway || "";

const pickArea = (address?: RawAddress) =>
  address?.suburb ||
  address?.neighbourhood ||
  address?.quarter ||
  address?.city_district ||
  address?.state_district ||
  address?.hamlet ||
  undefined;

const pickCity = (address?: RawAddress) =>
  address?.city || address?.town || address?.village || address?.county || "";

const normalize = (entry: NominatimSearchResult): GeocodedAddress => ({
  placeId: String(entry.place_id),
  fullAddress: entry.display_name,
  lat: Number(entry.lat),
  lng: Number(entry.lon),
  houseNo: entry.address?.house_number,
  street: pickStreet(entry.address),
  landmark: entry.address?.neighbourhood,
  area: pickArea(entry.address),
  city: pickCity(entry.address),
  state: entry.address?.state || "",
  postalCode: entry.address?.postcode,
  country: entry.address?.country || "",
});

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url, {
    headers: requestHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Geocoding provider returned ${response.status}.`);
  }

  return (await response.json()) as T;
};

export const searchAddresses = async (query: string, limit = 5) => {
  const search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "en",
    limit: String(limit),
  });

  const data = await fetchJson<NominatimSearchResult[]>(
    `${NOMINATIM_BASE}/search?${search.toString()}`,
  );

  return data.map(normalize);
};

export const reverseGeocode = async (lat: number, lng: number) => {
  const search = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "en",
    zoom: "18",
  });

  const data = await fetchJson<NominatimSearchResult>(
    `${NOMINATIM_BASE}/reverse?${search.toString()}`,
  );

  return normalize(data);
};
