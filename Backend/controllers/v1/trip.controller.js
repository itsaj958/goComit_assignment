// v1 Trip Controller - Trip lifecycle management
const { validationResult } = require('express-validator');
const prisma = require('../../db/prisma');
const { sendMessageToSocketId } = require('../../socket');
const mapService = require('../../services/maps.service');
const { calculateSurgeMultiplier } = require('../../utils/surgePricing');

/**
 * POST /v1/trips/:id/end
 * End a trip and trigger fare calculation
 * Uses transaction for atomicity
 */
exports.endTrip = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const driverId = req.driver.id;

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find trip with minimal required details
      const trip = await tx.trip.findUnique({
        where: { id },
        include: {
          ride: {
            include: {
              user: { select: { id: true, socketId: true } }
            }
          },
          driver: { select: { id: true } }
        }
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      // Verify driver owns this trip
      if (trip.driverId !== driverId) {
        throw new Error('Unauthorized');
      }

      if (trip.status !== 'ACTIVE' && trip.status !== 'PAUSED') {
        throw new Error(`Trip must be active or paused to end (status: ${trip.status})`);
      }

      const endTime = new Date();
      const startTime = trip.startTime || new Date();
      
      // Calculate total duration including paused time
      let totalDurationSeconds = Math.floor((endTime - startTime) / 1000);
      if (trip.pausedAt) {
        // Subtract paused duration if trip was paused
        const pausedDuration = Math.floor((endTime - trip.pausedAt) / 1000);
        totalDurationSeconds -= pausedDuration;
      }

      // Calculate final fare based on actual distance and time
      const distanceTime = await mapService.getDistanceTime(
        `${trip.ride.pickupLat},${trip.ride.pickupLng}`,
        `${trip.ride.destLat},${trip.ride.destLng}`
      );

      const distanceKm = distanceTime.distance.value / 1000;
      const durationMin = totalDurationSeconds / 60;

      // Fare calculation with dynamic surge pricing
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

      const base = baseFare[trip.ride.vehicleType] || 30;
      const distanceFare = distanceKm * (perKmRate[trip.ride.vehicleType] || 10);
      const timeFare = durationMin * (perMinuteRate[trip.ride.vehicleType] || 2);
      
      // Use dynamic surge multiplier (calculated at trip start)
      const surgeMultiplier = trip.surgeMultiplier || 1.0;
      const finalFare = Math.round((base + distanceFare + timeFare) * surgeMultiplier);

      // Update trip
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endTime,
          totalDistance: distanceTime.distance.value,
          totalDuration: totalDurationSeconds,
          finalFare,
          baseFare: base,
          distanceFare,
          timeFare,
          surgeMultiplier
        },
        include: {
          ride: { include: { user: { select: { id: true, socketId: true } } } },
          driver: { select: { id: true } }
        }
      });

      // Update ride status
      await tx.ride.update({
        where: { id: trip.rideId },
        data: {
          status: 'COMPLETED'
        }
      });

      // Update driver status back to active
      await tx.driver.update({
        where: { id: driverId },
        data: {
          status: 'ACTIVE'
        }
      });

      return updatedTrip;
    });

    // Notify rider via Socket.IO
    if (result.ride.user.socketId) {
      sendMessageToSocketId(result.ride.user.socketId, {
        event: 'trip-ended',
        data: {
          tripId: result.id,
          finalFare: result.finalFare,
          totalDistance: result.totalDistance,
          totalDuration: result.totalDuration
        }
      });
    }

    res.status(200).json({
      message: 'Trip ended successfully',
      trip: {
        id: result.id,
        finalFare: result.finalFare,
        totalDistance: result.totalDistance,
        totalDuration: result.totalDuration,
        baseFare: result.baseFare,
        distanceFare: result.distanceFare,
        timeFare: result.timeFare,
        surgeMultiplier: result.surgeMultiplier,
        endTime: result.endTime
      }
    });

  } catch (error) {
    console.error('End trip error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Unauthorized') ? 403 :
                      error.message.includes('must be active') ? 409 : 500;

    res.status(statusCode).json({ 
      message: error.message || 'Failed to end trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /v1/trips/:id/pause
 * Pause an active trip
 */
exports.pauseTrip = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const driverId = req.driver.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: {
          ride: {
            include: {
              user: true
            }
          }
        }
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      if (trip.driverId !== driverId) {
        throw new Error('Unauthorized');
      }

      if (trip.status !== 'ACTIVE') {
        throw new Error(`Trip must be active to pause (status: ${trip.status})`);
      }

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'PAUSED',
          pausedAt: new Date()
        },
        include: {
          ride: {
            include: {
              user: true
            }
          }
        }
      });

      return updatedTrip;
    });

    // Notify rider
    if (result.ride.user.socketId) {
      sendMessageToSocketId(result.ride.user.socketId, {
        event: 'trip-paused',
        data: {
          tripId: result.id,
          pausedAt: result.pausedAt
        }
      });
    }

    res.status(200).json({
      message: 'Trip paused successfully',
      trip: {
        id: result.id,
        status: result.status,
        pausedAt: result.pausedAt
      }
    });

  } catch (error) {
    console.error('Pause trip error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Unauthorized') ? 403 :
                      error.message.includes('must be active') ? 409 : 500;

    res.status(statusCode).json({ 
      message: error.message || 'Failed to pause trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /v1/trips/:id/resume
 * Resume a paused trip
 */
exports.resumeTrip = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const driverId = req.driver.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: {
          ride: {
            include: {
              user: true
            }
          }
        }
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      if (trip.driverId !== driverId) {
        throw new Error('Unauthorized');
      }

      if (trip.status !== 'PAUSED') {
        throw new Error(`Trip must be paused to resume (status: ${trip.status})`);
      }

      // Calculate paused duration and adjust start time
      const pausedDuration = trip.pausedAt ? Math.floor((new Date() - trip.pausedAt) / 1000) : 0;
      const adjustedStartTime = trip.startTime ? new Date(trip.startTime.getTime() + pausedDuration * 1000) : new Date();

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          pausedAt: null,
          startTime: adjustedStartTime
        },
        include: {
          ride: {
            include: {
              user: true
            }
          }
        }
      });

      return updatedTrip;
    });

    // Notify rider
    if (result.ride.user.socketId) {
      sendMessageToSocketId(result.ride.user.socketId, {
        event: 'trip-resumed',
        data: {
          tripId: result.id,
          resumedAt: new Date()
        }
      });
    }

    res.status(200).json({
      message: 'Trip resumed successfully',
      trip: {
        id: result.id,
        status: result.status
      }
    });

  } catch (error) {
    console.error('Resume trip error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Unauthorized') ? 403 :
                      error.message.includes('must be paused') ? 409 : 500;

    res.status(statusCode).json({ 
      message: error.message || 'Failed to resume trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

