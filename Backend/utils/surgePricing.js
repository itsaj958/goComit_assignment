// Dynamic surge pricing algorithm
// Calculates surge multiplier based on demand and supply in a given area

const prisma = require('../db/prisma');
const { getCachedNearbyDrivers, cacheSurgeMultiplier, getCachedSurgeMultiplier } = require('../db/redis');

/**
 * Calculate surge multiplier for a location based on demand/supply ratio
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} vehicleType - Vehicle type (CAR, AUTO, MOTORCYCLE)
 * @returns {Promise<number>} Surge multiplier (1.0 - 3.0)
 */
async function calculateSurgeMultiplier(lat, lng, vehicleType) {
  // Check cache first (5 minute TTL)
  const cached = await getCachedSurgeMultiplier(lat, lng, vehicleType);
  if (cached !== null) {
    return cached;
  }

  const radiusKm = 2; // 2km radius for surge calculation

  try {
    // Get active ride requests in the area (demand)
    const activeRides = await prisma.ride.count({
      where: {
        status: {
          in: ['PENDING', 'ACCEPTED']
        },
        vehicleType: vehicleType,
        pickupLat: {
          gte: lat - radiusKm * 0.009, // ~1km in degrees
          lte: lat + radiusKm * 0.009
        },
        pickupLng: {
          gte: lng - radiusKm * 0.009,
          lte: lng + radiusKm * 0.009
        },
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      }
    });

    // Get available drivers in the area (supply)
    const availableDrivers = await prisma.driver.count({
      where: {
        status: 'ACTIVE',
        latitude: {
          gte: lat - radiusKm * 0.009,
          lte: lat + radiusKm * 0.009
        },
        longitude: {
          gte: lng - radiusKm * 0.009,
          lte: lng + radiusKm * 0.009
        },
        vehicle: {
          vehicleType: vehicleType
        }
      }
    });

    // Calculate demand/supply ratio
    const demandSupplyRatio = availableDrivers > 0 
      ? activeRides / availableDrivers 
      : activeRides > 0 ? 10 : 1; // High demand if no drivers available

    // Calculate surge multiplier
    // Ratio < 0.5: Low demand (1.0x)
    // Ratio 0.5-1.0: Normal (1.0x - 1.5x)
    // Ratio 1.0-2.0: High demand (1.5x - 2.0x)
    // Ratio > 2.0: Very high demand (2.0x - 3.0x)
    let surgeMultiplier = 1.0;

    if (demandSupplyRatio < 0.5) {
      surgeMultiplier = 1.0;
    } else if (demandSupplyRatio < 1.0) {
      surgeMultiplier = 1.0 + (demandSupplyRatio - 0.5) * 1.0; // 1.0 to 1.5
    } else if (demandSupplyRatio < 2.0) {
      surgeMultiplier = 1.5 + (demandSupplyRatio - 1.0) * 0.5; // 1.5 to 2.0
    } else {
      surgeMultiplier = Math.min(2.0 + (demandSupplyRatio - 2.0) * 0.2, 3.0); // 2.0 to 3.0 (max)
    }

    // Round to 1 decimal place
    surgeMultiplier = Math.round(surgeMultiplier * 10) / 10;

    // Cache the result
    await cacheSurgeMultiplier(lat, lng, vehicleType, surgeMultiplier, 300); // 5 minutes

    return surgeMultiplier;

  } catch (error) {
    console.error('Surge pricing calculation error:', error);
    // Return default multiplier on error
    return 1.0;
  }
}

module.exports = {
  calculateSurgeMultiplier
};


