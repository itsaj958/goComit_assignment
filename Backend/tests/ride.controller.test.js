// Unit tests for v1 Ride Controller
const request = require('supertest');
const app = require('../app');
const prisma = require('../db/prisma');

// Mock Prisma for testing
jest.mock('../db/prisma', () => ({
  $transaction: jest.fn(),
  ride: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  driver: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

describe('Ride Controller', () => {
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
      };

      prisma.$transaction.mockResolvedValue(mockRide);

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
  });

  describe('GET /v1/rides/:id', () => {
    it('should return ride status', async () => {
      const mockRide = {
        id: 'ride-123',
        userId: 'user-123',
        status: 'ACCEPTED',
        pickupAddress: '123 Main St',
        destAddress: '456 Park Ave',
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

