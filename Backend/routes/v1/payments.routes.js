// v1 API routes for payment processing
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../../controllers/v1/payment.controller');
const authMiddleware = require('../../middlewares/auth.middleware.v1');
const { idempotencyMiddleware } = require('../../utils/idempotency');

/**
 * POST /v1/payments
 * Trigger payment flow for a completed trip
 */
router.post('/',
  authMiddleware.authUser,
  idempotencyMiddleware,
  [
    body('tripId').isString().notEmpty().withMessage('Valid trip ID required'),
    body('paymentMethod').isString().notEmpty().withMessage('Payment method required'),
  ],
  paymentController.processPayment
);

module.exports = router;

