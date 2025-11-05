// v1 API routes for ride management
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const rideController = require('../../controllers/v1/ride.controller');
const authMiddleware = require('../../middlewares/auth.middleware.v1');
const { idempotencyMiddleware } = require('../../utils/idempotency');
const { rideCreationLimiter } = require('../../middlewares/rateLimiter');

/**
 * POST /v1/rides
 * Create a new ride request
 * Requires: authentication, idempotency key (optional)
 */
router.post('/',
  rideCreationLimiter,
  authMiddleware.authUser,
  idempotencyMiddleware,
  [
    body('pickupAddress').isString().isLength({ min: 3 }).withMessage('Valid pickup address required'),
    body('pickupLat').isFloat({ min: -90, max: 90 }).withMessage('Valid pickup latitude required'),
    body('pickupLng').isFloat({ min: -180, max: 180 }).withMessage('Valid pickup longitude required'),
    body('destAddress').isString().isLength({ min: 3 }).withMessage('Valid destination address required'),
    body('destLat').isFloat({ min: -90, max: 90 }).withMessage('Valid destination latitude required'),
    body('destLng').isFloat({ min: -180, max: 180 }).withMessage('Valid destination longitude required'),
    body('vehicleType').isIn(['CAR', 'MOTORCYCLE', 'AUTO']).withMessage('Valid vehicle type required'),
    body('tier').optional().isString().withMessage('Tier must be a string'),
    body('paymentMethod').optional().isString().withMessage('Payment method must be a string'),
  ],
  rideController.createRide
);

/**
 * GET /v1/rides/:id
 * Get ride status by ID
 */
router.get('/:id',
  authMiddleware.authUser,
  [
    param('id').isString().notEmpty().withMessage('Valid ride ID required'),
  ],
  rideController.getRideStatus
);

module.exports = router;

