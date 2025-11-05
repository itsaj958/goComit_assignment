# Low-Level Design (LLD) - GoComet DAW

## 1. Database Schema

### 1.1 User Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  password TEXT NOT NULL,
  socket_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### 1.2 Driver Table
```sql
CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  password TEXT NOT NULL,
  socket_id TEXT,
  status TEXT DEFAULT 'INACTIVE',
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_location ON drivers(latitude, longitude);
CREATE INDEX idx_drivers_email ON drivers(email);
```

### 1.3 Ride Table
```sql
CREATE TABLE rides (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  driver_id TEXT REFERENCES drivers(id),
  pickup_address TEXT NOT NULL,
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  dest_address TEXT NOT NULL,
  dest_lat FLOAT NOT NULL,
  dest_lng FLOAT NOT NULL,
  vehicle_type TEXT NOT NULL,
  tier TEXT DEFAULT 'standard',
  payment_method TEXT,
  estimated_fare FLOAT,
  status TEXT DEFAULT 'PENDING',
  otp TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rides_user_id ON rides(user_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_idempotency_key ON rides(idempotency_key);
CREATE INDEX idx_rides_created_at ON rides(created_at);
```

### 1.4 Trip Table
```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  ride_id TEXT UNIQUE NOT NULL REFERENCES rides(id),
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  paused_at TIMESTAMP,
  total_distance FLOAT DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  final_fare FLOAT,
  base_fare FLOAT,
  distance_fare FLOAT,
  time_fare FLOAT,
  surge_multiplier FLOAT DEFAULT 1.0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_ride_id ON trips(ride_id);
```

### 1.5 Payment Table
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  psp_reference TEXT,
  psp_response JSONB,
  receipt_url TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_trip_id ON payments(trip_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_idempotency_key ON payments(idempotency_key);
```

## 2. API Endpoints Detailed Design

### 2.1 POST /v1/rides

**Request:**
```json
{
  "pickupAddress": "123 Main St",
  "pickupLat": 40.7128,
  "pickupLng": -74.0060,
  "destAddress": "456 Park Ave",
  "destLat": 40.7589,
  "destLng": -73.9851,
  "vehicleType": "CAR",
  "tier": "standard",
  "paymentMethod": "credit_card"
}
```

**Headers:**
- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` (optional)

**Process:**
1. Validate request body
2. Check idempotency key (if provided)
3. Calculate estimated fare
4. Create ride in transaction
5. Find nearby drivers (cached or fresh)
6. Notify drivers via Socket.IO
7. Return ride details

**Response:**
```json
{
  "id": "ride-123",
  "userId": "user-123",
  "pickupAddress": "123 Main St",
  "status": "PENDING",
  "estimatedFare": 25.50,
  "nearbyDriversCount": 5
}
```

### 2.2 POST /v1/drivers/:id/location

**Request:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Process:**
1. Validate coordinates
2. Update Redis cache (immediate)
3. Update database (async)
4. If on active trip, broadcast to rider
5. Return success

**Performance:** Optimized for high frequency (1-2 updates/sec)

### 2.3 POST /v1/drivers/:id/accept

**Request:**
```json
{
  "rideId": "ride-123"
}
```

**Process:**
1. Transaction start
2. Check driver availability
3. Check ride status (optimistic locking)
4. Update ride status to ACCEPTED
5. Create trip record
6. Update driver status to ON_TRIP
7. Transaction commit
8. Notify rider via Socket.IO
9. Return ride details

**Atomicity:** Entire operation is atomic via transaction

### 2.4 POST /v1/trips/:id/end

**Process:**
1. Transaction start
2. Verify trip ownership
3. Calculate final fare (distance + time + surge)
4. Update trip status to COMPLETED
5. Update ride status to COMPLETED
6. Update driver status to ACTIVE
7. Transaction commit
8. Notify rider
9. Return trip details with fare

### 2.5 POST /v1/payments

**Request:**
```json
{
  "tripId": "trip-123",
  "paymentMethod": "credit_card"
}
```

**Process:**
1. Check idempotency key
2. Verify trip completion
3. Call PSP API (simulated)
4. Create payment record
5. Update payment status
6. Notify user
7. Return payment details

## 3. Caching Strategy

### 3.1 Redis Keys

**Driver Location:**
- Key: `driver:location:{driverId}`
- TTL: 60 seconds
- Value: `{"latitude": 40.7128, "longitude": -74.0060, "timestamp": 1234567890}`

**Nearby Drivers:**
- Key: `nearby:drivers:{lat}:{lng}:{radius}`
- TTL: 30 seconds
- Value: `[{"id": "driver-1", "distance": 500, ...}, ...]`

**Idempotency:**
- Key: `idempotency:{key}`
- TTL: 24 hours
- Value: `{"statusCode": 201, "body": {...}}`

### 3.2 Cache Invalidation

- **Driver Location:** Invalidated on location update
- **Nearby Drivers:** Invalidated when driver accepts ride
- **Idempotency:** Auto-expires after TTL

## 4. Real-time Communication

### 4.1 Socket.IO Events

**Client → Server:**
- `join` - User/Driver connects
- `update-location-driver` - Driver location update

**Server → Client:**
- `new-ride` - New ride available (drivers)
- `ride-accepted` - Ride accepted (rider)
- `driver-location-update` - Driver location (rider)
- `trip-ended` - Trip completed
- `payment-completed` - Payment processed

### 4.2 Rooms

- `user:{userId}` - User-specific room
- `driver:{driverId}` - Driver-specific room

## 5. Error Handling

### 5.1 Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### 5.2 Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication)
- `403` - Forbidden (authorization)
- `404` - Not Found
- `409` - Conflict (race condition, duplicate)
- `500` - Internal Server Error

## 6. Performance Optimizations

### 6.1 Database Queries
- **Indexes:** All foreign keys and frequently queried fields indexed
- **Select Specific Fields:** Only select needed fields
- **Connection Pooling:** Prisma connection pooling

### 6.2 Caching
- **Redis:** Fast lookups for location and nearby drivers
- **TTL Management:** Appropriate TTLs for freshness

### 6.3 Transaction Management
- **Minimal Transaction Scope:** Only necessary operations in transactions
- **Optimistic Locking:** Check status before update

## 7. Security Considerations

### 7.1 Authentication
- JWT tokens with 24-hour expiration
- Token blacklisting in Redis
- Secure password hashing (bcrypt)

### 7.2 Input Validation
- express-validator for all inputs
- Type checking and range validation
- SQL injection prevention (Prisma)

### 7.3 Rate Limiting
- Socket.IO connection rate limiting
- API rate limiting (future enhancement)

## 8. Monitoring

### 8.1 New Relic Integration
- Automatic instrumentation
- Custom metrics for business logic
- Error tracking and alerting

### 8.2 Health Checks
- `/health` endpoint
- Database connectivity check
- Redis connectivity check

## 9. Testing Strategy

### 9.1 Unit Tests
- Controller functions
- Service functions
- Utility functions

### 9.2 Integration Tests
- API endpoint tests
- Database operations
- Redis operations

### 9.3 Test Coverage
- Target: 80% code coverage
- Critical paths: 100% coverage

