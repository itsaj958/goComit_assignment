// v1 Payment Controller - Payment processing via external PSPs
const { validationResult } = require('express-validator');
const prisma = require('../../db/prisma');
const { sendMessageToSocketId } = require('../../socket');

/**
 * POST /v1/payments
 * Trigger payment flow for a completed trip
 * Simulates external PSP integration
 */
exports.processPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tripId, paymentMethod } = req.body;
  const userId = req.user.id;
  const idempotencyKey = req.idempotencyKey;

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing payment with same idempotency key
      if (idempotencyKey) {
        const existingPayment = await tx.payment.findUnique({
          where: { idempotencyKey }
        });
        if (existingPayment) {
          return existingPayment;
        }
      }

      // Find trip with ride details
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
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

      // Verify trip belongs to user
      if (trip.ride.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (trip.status !== 'COMPLETED') {
        throw new Error('Trip must be completed before payment');
      }

      if (!trip.finalFare) {
        throw new Error('Trip fare not calculated');
      }

      // Check if payment already exists
      const existingPayment = await tx.payment.findFirst({
        where: {
          tripId,
          status: {
            in: ['COMPLETED', 'PROCESSING']
          }
        }
      });

      if (existingPayment) {
        throw new Error('Payment already processed');
      }

      // Simulate PSP API call
      // In production, this would call actual payment service provider (Stripe, Razorpay, etc.)
      const pspResponse = await simulatePSPCall(trip.finalFare, paymentMethod);

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          tripId,
          amount: trip.finalFare,
          currency: 'USD',
          paymentMethod,
          status: pspResponse.success ? 'COMPLETED' : 'FAILED',
          pspReference: pspResponse.reference,
          pspResponse: pspResponse,
          receiptUrl: pspResponse.receiptUrl,
          idempotencyKey
        },
        include: {
          trip: {
            include: {
              ride: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      return payment;
    });

    // Notify user via Socket.IO
    if (result.trip.ride.user.socketId) {
      sendMessageToSocketId(result.trip.ride.user.socketId, {
        event: 'payment-completed',
        data: {
          paymentId: result.id,
          amount: result.amount,
          status: result.status,
          receiptUrl: result.receiptUrl
        }
      });
    }

    res.status(200).json({
      message: 'Payment processed',
      payment: {
        id: result.id,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        pspReference: result.pspReference,
        receiptUrl: result.receiptUrl
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Unauthorized') ? 403 :
                      error.message.includes('already processed') ? 409 :
                      error.message.includes('must be completed') ? 400 : 500;

    res.status(statusCode).json({ 
      message: error.message || 'Failed to process payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Simulate PSP (Payment Service Provider) API call
 * In production, replace with actual PSP integration (Stripe, Razorpay, etc.)
 */
async function simulatePSPCall(amount, paymentMethod) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate success (90% success rate)
  const success = Math.random() > 0.1;

  if (success) {
    return {
      success: true,
      reference: `PSP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receiptUrl: `https://gocomet-daw.com/receipts/${Date.now()}.pdf`,
      message: 'Payment successful'
    };
  } else {
    throw new Error('Payment processing failed');
  }
}

