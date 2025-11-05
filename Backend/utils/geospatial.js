// Geospatial utilities for driver-rider matching
// Uses Haversine formula for distance calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate bounding box for radius search (optimized for database queries)
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @returns {Object} Bounding box coordinates
 */
function getBoundingBox(lat, lng, radiusMeters) {
  const R = 6371e3; // Earth's radius in meters
  
  // Approximate latitude offset (1 degree ≈ 111km)
  const latOffset = radiusMeters / 111000;
  
  // Longitude offset depends on latitude
  const lngOffset = radiusMeters / (111000 * Math.cos(lat * Math.PI / 180));
  
  return {
    minLat: lat - latOffset,
    maxLat: lat + latOffset,
    minLng: lng - lngOffset,
    maxLng: lng + lngOffset,
  };
}

/**
 * Check if driver is within radius of pickup location
 * @param {number} driverLat - Driver latitude
 * @param {number} driverLng - Driver longitude
 * @param {number} pickupLat - Pickup latitude
 * @param {number} pickupLng - Pickup longitude
 * @param {number} radiusMeters - Maximum radius in meters
 * @returns {boolean} True if driver is within radius
 */
function isWithinRadius(driverLat, driverLng, pickupLat, pickupLng, radiusMeters) {
  const distance = calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
  return distance <= radiusMeters;
}

module.exports = {
  calculateDistance,
  getBoundingBox,
  isWithinRadius,
};

