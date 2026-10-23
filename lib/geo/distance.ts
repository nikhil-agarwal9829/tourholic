/**
 * Geospatial distance calculation using Haversine formula.
 * Coordinates are formatted strictly as [longitude, latitude].
 */

const EARTH_RADIUS_METERS = 6371000; // Mean Earth radius in meters
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two GeoJSON points in meters.
 * Point order: [longitude, latitude]
 */
export function calculateDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculates distance between two GeoJSON points in kilometers.
 * Point order: [longitude, latitude]
 */
export function calculateDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const meters = calculateDistanceMeters(coord1, coord2);
  return Math.round(meters / 1000);
}

/**
 * Formats distance in kilometers for clean, professional UI display.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return "< 1 km";
  if (distanceKm >= 1000) {
    return `${(distanceKm / 1000).toFixed(1)}k km`;
  }
  return `${distanceKm} km`;
}
