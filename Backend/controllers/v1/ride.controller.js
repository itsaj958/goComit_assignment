// v1 Ride Controller - Core ride management logic
const { validationResult } = require('express-validator');
const prisma = require('../../db/prisma');
const { 
  getCachedNearbyDrivers, 
  cacheNearbyDrivers,
  invalidateDriverLocation 
} = require('../../db/redis');
const { sendMessageToSocketId } = require('../../socket');
const { calculateDistance, getBoundingBox } = require('../../utils/geospatial');
const mapService = require('../../services/maps.service');

/**
 * POST /v1/rides
 * Create a new ride request with driver matching
 * Uses transactions for atomicity and Redis for caching
 */
exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    pickupAddress,
    pickupLat,
    pickupLng,
    destAddress,
    destLat,
    destLng,
    vehicleType,
    tier = 'standard',
    paymentMethod
  } = req.body;

  const userId = req.user.id;
  const idempotencyKey = req.idempotencyKey;

  try {
    // Use transaction to ensure atomicity
    const ride = await prisma.$transaction(async (tx) => {
      // Check for existing ride with same idempotency key
      if (idempotencyKey) {
        const existingRide = await tx.ride.findUnique({
          where: { idempotencyKey }
        });
        if (existingRide) {
          return existingRide;
        }
      }

      // Calculate estimated fare
      const distanceTime = await mapService.getDistanceTime(
        `${pickupLat},${pickupLng}`,
        `${destLat},${destLng}`
      );

      const baseFare = {
        AUTO: 30,
        CAR: 50,
        MOTORCYCLE: 20
      };

      const perKmRate = {
        AUTO: 10,
        CAR: 15,
        MOTORCYCLE: 8
      };

      const perMinuteRate = {
        AUTO: 2,
        CAR: 3,
        MOTORCYCLE: 1.5
      };

      const distanceKm = distanceTime.distance.value / 1000;
      const durationMin = distanceTime.duration.value / 60;
      const estimatedFare = Math.round(
        baseFare[vehicleType] +
        (distanceKm * perKmRate[vehicleType]) +
        (durationMin * perMinuteRate[vehicleType])
      );

      // Create ride with Prisma
      const newRide = await tx.ride.create({
        data: {
          userId,
          pickupAddress,
          pickupLat,
          pickupLng,
          destAddress,
          destLat,
          destLng,
          vehicleType,
          tier,
          paymentMethod,
          estimatedFare,
          idempotencyKey,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return newRide;
    });

    // Find nearby drivers (cached or fresh)
    const radiusKm = 5; // 5km radius
    const nearbyDrivers = await findNearbyDrivers(
      pickupLat,
      pickupLng,
      radiusKm,
      vehicleType
    );

    // Notify nearby drivers via Socket.IO
    nearbyDrivers.forEach(driver => {
      if (driver.socketId) {
        sendMessageToSocketId(driver.socketId, {
          event: 'new-ride',
          data: {
            ...ride,
            otp: undefined // Don't send OTP to drivers
          }
        });
      }
    });

    // Return ride without OTP
    const { otp, ...rideResponse } = ride;
    res.status(201).json({
      ...rideResponse,
      nearbyDriversCount: nearbyDrivers.length
    });

  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ 
      message: 'Failed to create ride',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /v1/rides/:id
 * Get ride status by ID
 */
exports.getRideStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const userId = req.user.id;

  try {
    const ride = await prisma.ride.findFirst({
      where: {
        id,
        userId // Ensure user can only access their own rides
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        driver: {
          include: {
            vehicle: true
          }
        },
        trip: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Return full ride to the owning user, including OTP (safe for owner only)
    res.status(200).json(ride);

  } catch (error) {
    console.error('Get ride status error:', error);
    res.status(500).json({ 
      message: 'Failed to get ride status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to find nearby drivers with caching
 * Optimized for performance with Redis caching
 */
async function findNearbyDrivers(lat, lng, radiusKm, vehicleType) {
  // Check cache first
  const cached = await getCachedNearbyDrivers(lat, lng, radiusKm);
  if (cached) {
    return cached;
  }

  // Calculate bounding box for efficient query
  const bbox = getBoundingBox(lat, lng, radiusKm * 1000);

  // Query database for active drivers in bounding box
  const drivers = await prisma.driver.findMany({
    where: {
      status: 'ACTIVE',
      latitude: {
        gte: bbox.minLat,
        lte: bbox.maxLat
      },
      longitude: {
        gte: bbox.minLng,
        lte: bbox.maxLng
      },
      vehicle: {
        vehicleType: vehicleType
      }
    },
    include: {
      vehicle: true
    },
    take: 50 // Limit results
  });

  // Filter by exact distance (Haversine) and sort by distance
  const driversWithDistance = drivers
    .map(driver => ({
      ...driver,
      distance: calculateDistance(lat, lng, driver.latitude, driver.longitude)
    }))
    .filter(driver => driver.distance <= radiusKm * 1000)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10); // Top 10 closest drivers

  // Cache result
  await cacheNearbyDrivers(lat, lng, radiusKm, driversWithDistance);

  return driversWithDistance;
}

