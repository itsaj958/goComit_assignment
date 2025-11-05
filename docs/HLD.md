# High-Level Design (HLD) - GoComet DAW

## 1. System Overview

GoComet DAW is a multi-tenant, multi-region ride-hailing platform designed to handle:
- **100k drivers** concurrently
- **10k ride requests per minute**
- **200k location updates per second**
- **Sub-second p95 latency** for driver-rider matching

## 2. Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│              Socket.IO Client + Web UI                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTPS + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────┐
│              API Gateway / Load Balancer                 │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  Backend     │ │  Backend   │ │  Backend   │
│  Service 1   │ │  Service 2 │ │  Service N │
│  (Node.js)   │ │  (Node.js) │ │  (Node.js) │
└───────┬──────┘ └─────┬──────┘ └─────┬──────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│ PostgreSQL   │ │   Redis    │ │  Socket.IO  │
│  (Primary)   │ │  (Cache)   │ │  (Real-time)│
└──────────────┘ └────────────┘ └────────────┘
```

### 2.2 Data Flow

1. **Ride Request Flow:**
   - User creates ride request → API validates → Stores in PostgreSQL
   - System queries nearby drivers (cached in Redis)
   - Notifies nearby drivers via Socket.IO
   - Driver accepts → Creates Trip record → Updates status

2. **Location Update Flow:**
   - Driver sends location (1-2/sec) → Redis cache (fast)
   - Async DB update (eventual consistency)
   - Broadcast to rider if on active trip

3. **Payment Flow:**
   - Trip ends → Calculate fare → Create payment record
   - Call external PSP API → Update payment status
   - Generate receipt

## 3. Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (with Prisma ORM)
- **Cache:** Redis
- **Real-time:** Socket.IO
- **Monitoring:** New Relic
- **Authentication:** JWT
- **Validation:** express-validator
- **Testing:** Jest

## 4. Key Design Decisions

### 4.1 Database Choice: PostgreSQL
- **Rationale:** ACID compliance for transactions, strong consistency for payments
- **Optimization:** Indexes on frequently queried fields (location, status, userId)

### 4.2 Caching Strategy: Redis
- **Driver Locations:** Cached for 60 seconds (high frequency updates)
- **Nearby Drivers:** Cached for 30 seconds (location-based queries)
- **Idempotency Keys:** 24-hour TTL

### 4.3 Real-time Updates: Socket.IO
- **Connection:** WebSocket with fallback to polling
- **Rate Limiting:** 10 connections per IP per minute
- **Rooms:** User/Driver specific rooms for targeted messaging

### 4.4 Transaction Management
- **Prisma Transactions:** All state-changing operations use transactions
- **Optimistic Locking:** Prevents race conditions in ride acceptance
- **Idempotency:** Prevents duplicate operations

## 5. Scalability Considerations

### 5.1 Horizontal Scaling
- **Stateless Services:** All backend services are stateless
- **Load Balancing:** Multiple instances behind load balancer
- **Database Replication:** Read replicas for read-heavy operations

### 5.2 Caching Strategy
- **Write-Through:** Write to DB + Cache simultaneously
- **Cache-Aside:** Read from cache, fallback to DB
- **TTL Management:** Appropriate TTLs to balance freshness and performance

### 5.3 Database Optimization
- **Indexes:** Strategic indexes on foreign keys and frequently queried fields
- **Connection Pooling:** Prisma connection pooling
- **Query Optimization:** Efficient queries with proper joins

## 6. Security

- **JWT Authentication:** Secure token-based authentication
- **Request Validation:** express-validator for input validation
- **Rate Limiting:** Socket.IO connection rate limiting
- **CORS:** Proper CORS configuration
- **Environment Variables:** Sensitive data in environment variables

## 7. Monitoring & Observability

- **New Relic:** APM for performance monitoring
- **Health Checks:** `/health` endpoint for monitoring
- **Error Logging:** Comprehensive error logging
- **Metrics:** API latency, error rates, throughput

## 8. Multi-Tenancy & Multi-Region

### 8.1 Multi-Tenancy
- **Tenant Isolation:** Database-level tenant separation (future enhancement)
- **Shared Infrastructure:** Current implementation uses shared database

### 8.2 Multi-Region
- **Region-Local Writes:** Writes stay in local region
- **Eventual Consistency:** Cross-region sync is eventual
- **Regional Caching:** Redis instances per region

## 9. API Design

### 9.1 RESTful APIs
- **Versioning:** `/v1/` prefix for API versioning
- **Idempotency:** Idempotency keys for POST/PUT operations
- **Error Handling:** Consistent error response format

### 9.2 Core APIs
- `POST /v1/rides` - Create ride request
- `GET /v1/rides/:id` - Get ride status
- `POST /v1/drivers/:id/location` - Update driver location
- `POST /v1/drivers/:id/accept` - Accept ride
- `POST /v1/trips/:id/end` - End trip
- `POST /v1/payments` - Process payment

## 10. Future Enhancements

- **Message Queue:** Redis Pub/Sub or RabbitMQ for async processing
- **Geospatial Indexing:** PostGIS for advanced location queries
- **Microservices:** Split into separate services (matching, payments, etc.)
- **GraphQL:** Alternative API layer for flexible queries
- **Kubernetes:** Container orchestration for better scaling

