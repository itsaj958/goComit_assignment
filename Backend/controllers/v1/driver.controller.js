// v1 Driver Controller - Driver location and ride acceptance
const { validationResult } = require('express-validator');
const prisma = require('../../db/prisma');
const { 
  cacheDriverLocation, 
  getCachedDriverLocation,
  invalidateDriverLocation 
} = require('../../db/redis');
const { sendMessageToSocketId } = require('../../socket');

/**
 * POST /v1/drivers/:id/location
 * Update driver location (high frequency - 1-2 per second)
 * Optimized with Redis caching for performance
 */
exports.updateLocation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { latitude, longitude } = req.body;
  const driverId = req.driver?.id || id;

  // Verify driver owns this ID
  if (driverId !== id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    // Update in Redis cache first (fast)
    await cacheDriverLocation(driverId, latitude, longitude);

    // Update in database (async, eventual consistency)
    // Use upsert to handle initial location setting
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        latitude,
        longitude,
        updatedAt: new Date()
      }
    }).catch(err => {
      console.error('Database update error (non-critical):', err);
      // Continue even if DB update fails - Redis cache is primary
    });

    // Broadcast location update to connected riders (if on active trip)
    const activeTrip = await prisma.trip.findFirst({
      where: { driverId, status: 'ACTIVE' },
      select: {
        ride: { select: { user: { select: { socketId: true } } } }
      }
    });

    if (activeTrip && activeTrip.ride?.user?.socketId) {
      sendMessageToSocketId(activeTrip.ride.user.socketId, {
        event: 'driver-location-update',
        data: {
          driverId,
          latitude,
          longitude,
          timestamp: Date.now()
        }
      });
    }

    res.status(200).json({ 
      message: 'Location updated',
      latitude,
      longitude
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ 
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /v1/drivers/:id/accept
 * Accept a ride assignment
 * Uses transaction to ensure atomicity (prevent race conditions)
 */
exports.acceptRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { rideId } = req.body;
  const driverId = req.driver?.id || id;

  // Verify driver owns this ID
  if (driverId !== id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    // Use transaction to ensure atomicity with conditional update to avoid races
    const result = await prisma.$transaction(async (tx) => {
      // Check if driver is available (ACTIVE)
      const driver = await tx.driver.findUnique({
        where: { id: driverId },
        select: { id: true, status: true }
      });

      if (!driver || driver.status !== 'ACTIVE') {
        throw new Error('Driver not available');
      }

      // Attempt conditional update: transition PENDING -> ONGOING (start immediately on accept)
      const updatedCount = await tx.ride.updateMany({
        where: { id: rideId, status: 'PENDING' },
        data: { status: 'ONGOING', driverId }
      });

      if (updatedCount.count !== 1) {
        // Someone else took it or ride not found
        const current = await tx.ride.findUnique({ where: { id: rideId }, select: { status: true } });
        if (!current) throw new Error('Ride not found');
        throw new Error(`Ride already ${current.status?.toLowerCase()}`);
      }

      // Fetch required fields after successful update
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: {
          user: { select: { id: true, socketId: true } },
          driver: { include: { vehicle: true } }
        }
      });

      // Calculate dynamic surge multiplier based on location and demand
      const { calculateSurgeMultiplier } = require('../../utils/surgePricing');
      const surgeMultiplier = await calculateSurgeMultiplier(
        ride.pickupLat,
        ride.pickupLng,
        ride.vehicleType
      );

      // Create trip record (required for trip lifecycle management)
      await tx.trip.create({
        data: {
          rideId,
          driverId,
          status: 'ACTIVE',
          startTime: new Date(),
          surgeMultiplier
        }
      });

      // Update driver status
      await tx.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } });

      // Invalidate nearby drivers cache for this location
      invalidateDriverLocation(driverId);

      return ride;
    });

    // Notify rider via Socket.IO: ride has started immediately
    if (result.user.socketId) {
      sendMessageToSocketId(result.user.socketId, {
        event: 'ride-started',
        data: result
      });
    }

    // Notify other drivers that this ride is taken
    // (Could be optimized with Redis pub/sub)

    res.status(200).json({
      message: 'Ride started',
      ride: {
        ...result,
        otp: undefined
      }
    });

  } catch (error) {
    console.error('Accept ride error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('already') ? 409 :
                      error.message.includes('not available') ? 409 : 500;

    res.status(statusCode).json({ 
      message: error.message || 'Failed to accept ride',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

