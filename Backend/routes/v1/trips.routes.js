// v1 API routes for trip management
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const tripController = require('../../controllers/v1/trip.controller');
const authMiddleware = require('../../middlewares/auth.middleware.v1');
const { idempotencyMiddleware } = require('../../utils/idempotency');

/**
 * POST /v1/trips/:id/end
 * End a trip and trigger fare calculation
 */
router.post('/:id/end',
  authMiddleware.authDriver,
  idempotencyMiddleware,
  [
    param('id').isString().notEmpty().withMessage('Valid trip ID required'),
  ],
  tripController.endTrip
);

module.exports = router;

