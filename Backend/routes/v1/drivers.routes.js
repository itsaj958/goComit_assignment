// v1 API routes for driver operations
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const driverController = require('../../controllers/v1/driver.controller');
const authMiddleware = require('../../middlewares/auth.middleware.v1');
const { idempotencyMiddleware } = require('../../utils/idempotency');
const { locationUpdateLimiter } = require('../../middlewares/rateLimiter');

/**
 * POST /v1/drivers/:id/location
 * Update driver location (called frequently - 1-2 per second)
 * Optimized for high throughput with special rate limiter
 */
router.post('/:id/location',
  locationUpdateLimiter,
  authMiddleware.authDriver,
  [
    param('id').isString().notEmpty().withMessage('Valid driver ID required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  ],
  driverController.updateLocation
);

/**
 * POST /v1/drivers/:id/accept
 * Accept a ride assignment
 */
router.post('/:id/accept',
  authMiddleware.authDriver,
  idempotencyMiddleware,
  [
    param('id').isString().notEmpty().withMessage('Valid driver ID required'),
    body('rideId').isString().notEmpty().withMessage('Valid ride ID required'),
  ],
  driverController.acceptRide
);

module.exports = router;

