const normalize = (value?: string) => (value ?? "").trim().toLowerCase();

export const buildTrackingUrl = (
  courierName?: string,
  trackingNumber?: string,
  trackingUrl?: string,
) => {
  if (trackingUrl) return trackingUrl;
  if (!trackingNumber) return "";
  const name = normalize(courierName);

  if (name.includes("tcs")) {
    return `https://www.tcsexpress.com/track/track?trackid=${encodeURIComponent(trackingNumber)}`;
  }
  if (name.includes("leopards")) {
    return `https://www.leopardscourier.com/track/?cnno=${encodeURIComponent(trackingNumber)}`;
  }
  if (name.includes("m&p") || name.includes("m&p")) {
    return `https://www.mulphilog.com/tracking/?tracking_number=${encodeURIComponent(trackingNumber)}`;
  }
  if (name.includes("trax")) {
    return `https://trax.pk/track/${encodeURIComponent(trackingNumber)}`;
  }
  return "";
};
