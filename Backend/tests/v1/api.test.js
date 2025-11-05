// Comprehensive unit tests for GoComet DAW v1 API
const request = require('supertest');
const app = require('../app');
const prisma = require('../db/prisma');
const { getRedisClient } = require('../db/redis');

// Mock external dependencies
jest.mock('../db/prisma');
jest.mock('../db/redis');
jest.mock('../services/maps.service');
jest.mock('../socket');

describe('Ride Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/rides', () => {
    it('should create a ride request successfully', async () => {
      const mockRide = {
        id: 'ride-123',
        userId: 'user-123',
        pickupAddress: '123 Main St',
        pickupLat: 40.7128,
        pickupLng: -74.0060,
        destAddress: '456 Park Ave',
        destLat: 40.7589,
        destLng: -73.9851,
        vehicleType: 'CAR',
        status: 'PENDING',
        estimatedFare: 25.50,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      prisma.$transaction.mockResolvedValue(mockRide);
      prisma.driver.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/v1/rides')
        .set('Authorization', 'Bearer valid-token')
        .send({
          pickupAddress: '123 Main St',
          pickupLat: 40.7128,
          pickupLng: -74.0060,
          destAddress: '456 Park Ave',
          destLat: 40.7589,
          destLng: -73.9851,
          vehicleType: 'CAR',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/v1/rides')
        .set('Authorization', 'Bearer valid-token')
        .send({
          pickupAddress: '123 Main St',
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should handle idempotency key correctly', async () => {
      const mockRide = {
        id: 'ride-123',
        userId: 'user-123',
        status: 'PENDING',
      };

      prisma.$transaction.mockResolvedValue(mockRide);

      const idempotencyKey = 'test-key-123';

      const response = await request(app)
        .post('/v1/rides')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          pickupAddress: '123 Main St',
          pickupLat: 40.7128,
          pickupLng: -74.0060,
          destAddress: '456 Park Ave',
          destLat: 40.7589,
          destLng: -73.9851,
          vehicleType: 'CAR',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /v1/rides/:id', () => {
    it('should return ride status', async () => {
      const mockRide = {
        id: 'ride-123',
        userId: 'user-123',
        status: 'ACCEPTED',
        pickupAddress: '123 Main St',
        destAddress: '456 Park Ave',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      prisma.ride.findFirst.mockResolvedValue(mockRide);

      const response = await request(app)
        .get('/v1/rides/ride-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('ride-123');
      expect(response.body.status).toBe('ACCEPTED');
    });

    it('should return 404 for non-existent ride', async () => {
      prisma.ride.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/v1/rides/non-existent')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });
});

describe('Driver Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/drivers/:id/location', () => {
    it('should update driver location successfully', async () => {
      prisma.driver.update.mockResolvedValue({
        id: 'driver-123',
        latitude: 40.7128,
        longitude: -74.0060
      });
      prisma.trip.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/v1/drivers/driver-123/location')
        .set('Authorization', 'Bearer valid-token')
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .post('/v1/drivers/driver-123/location')
        .set('Authorization', 'Bearer valid-token')
        .send({
          latitude: 200, // Invalid latitude
          longitude: -74.0060
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/drivers/:id/accept', () => {
    it('should accept ride successfully', async () => {
      const mockRide = {
        id: 'ride-123',
        driverId: 'driver-123',
        status: 'ACCEPTED',
        user: {
          id: 'user-123',
          socketId: 'socket-123'
        }
      };

      prisma.$transaction.mockResolvedValue(mockRide);

      const response = await request(app)
        .post('/v1/drivers/driver-123/accept')
        .set('Authorization', 'Bearer valid-token')
        .send({
          rideId: 'ride-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ride accepted');
    });

    it('should return 409 if ride already accepted', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Ride already accepted'));

      const response = await request(app)
        .post('/v1/drivers/driver-123/accept')
        .set('Authorization', 'Bearer valid-token')
        .send({
          rideId: 'ride-123'
        });

      expect(response.status).toBe(409);
    });
  });
});

describe('Trip Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/trips/:id/end', () => {
    it('should end trip successfully', async () => {
      const mockTrip = {
        id: 'trip-123',
        driverId: 'driver-123',
        status: 'ACTIVE',
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        surgeMultiplier: 1.5,
        finalFare: 50.00,
        totalDistance: 5000,
        totalDuration: 300,
        ride: {
          id: 'ride-123',
          userId: 'user-123',
          vehicleType: 'CAR',
          pickupLat: 40.7128,
          pickupLng: -74.0060,
          destLat: 40.7589,
          destLng: -73.9851,
          user: {
            id: 'user-123',
            socketId: 'socket-123'
          }
        }
      };

      prisma.$transaction.mockResolvedValue(mockTrip);

      const response = await request(app)
        .post('/v1/trips/trip-123/end')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Trip ended successfully');
      expect(response.body.trip).toHaveProperty('finalFare');
    });

    it('should return 409 if trip not active', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Trip is not active'));

      const response = await request(app)
        .post('/v1/trips/trip-123/end')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(409);
    });
  });

  describe('POST /v1/trips/:id/pause', () => {
    it('should pause trip successfully', async () => {
      const mockTrip = {
        id: 'trip-123',
        driverId: 'driver-123',
        status: 'PAUSED',
        pausedAt: new Date(),
        ride: {
          user: {
            socketId: 'socket-123'
          }
        }
      };

      prisma.$transaction.mockResolvedValue(mockTrip);

      const response = await request(app)
        .post('/v1/trips/trip-123/pause')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Trip paused successfully');
      expect(response.body.trip.status).toBe('PAUSED');
    });
  });

  describe('POST /v1/trips/:id/resume', () => {
    it('should resume trip successfully', async () => {
      const mockTrip = {
        id: 'trip-123',
        driverId: 'driver-123',
        status: 'ACTIVE',
        ride: {
          user: {
            socketId: 'socket-123'
          }
        }
      };

      prisma.$transaction.mockResolvedValue(mockTrip);

      const response = await request(app)
        .post('/v1/trips/trip-123/resume')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Trip resumed successfully');
      expect(response.body.trip.status).toBe('ACTIVE');
    });
  });
});

describe('Payment Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/payments', () => {
    it('should process payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        tripId: 'trip-123',
        amount: 50.00,
        status: 'COMPLETED',
        pspReference: 'PSP_123456',
        receiptUrl: 'https://gocomet-daw.com/receipts/123.pdf',
        trip: {
          ride: {
            user: {
              socketId: 'socket-123'
            }
          }
        }
      };

      prisma.$transaction.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/v1/payments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          tripId: 'trip-123',
          paymentMethod: 'credit_card'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Payment processed');
      expect(response.body.payment.status).toBe('COMPLETED');
    });

    it('should return 400 if trip not completed', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Trip must be completed before payment'));

      const response = await request(app)
        .post('/v1/payments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          tripId: 'trip-123',
          paymentMethod: 'credit_card'
        });

      expect(response.status).toBe(400);
    });
  });
});

describe('Surge Pricing Tests', () => {
  it('should calculate surge multiplier correctly', async () => {
    const { calculateSurgeMultiplier } = require('../utils/surgePricing');
    
    // Mock Prisma calls
    prisma.ride.count.mockResolvedValue(10); // High demand
    prisma.driver.count.mockResolvedValue(5); // Low supply

    const multiplier = await calculateSurgeMultiplier(40.7128, -74.0060, 'CAR');
    
    expect(multiplier).toBeGreaterThanOrEqual(1.0);
    expect(multiplier).toBeLessThanOrEqual(3.0);
  });
});

describe('Error Handling Tests', () => {
  it('should handle database errors gracefully', async () => {
    prisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .post('/v1/rides')
      .set('Authorization', 'Bearer valid-token')
      .send({
        pickupAddress: '123 Main St',
        pickupLat: 40.7128,
        pickupLng: -74.0060,
        destAddress: '456 Park Ave',
        destLat: 40.7589,
        destLng: -73.9851,
        vehicleType: 'CAR',
      });

    expect(response.status).toBe(500);
  });

  it('should handle validation errors correctly', async () => {
    const response = await request(app)
      .post('/v1/rides')
      .set('Authorization', 'Bearer valid-token')
      .send({
        // Invalid data
        pickupLat: 'invalid',
        vehicleType: 'INVALID_TYPE'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
});


