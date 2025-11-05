# GoComet DAW - Backend API

A production-ready, scalable ride-hailing backend system built with Node.js, Express, PostgreSQL, and Redis.

## 🚀 Features

- **Multi-tenant, Multi-region** architecture
- **Real-time driver location updates** (1-2 per second)
- **Sub-second driver-rider matching** (p95 < 1s)
- **Dynamic surge pricing** support
- **Transaction-based atomicity** for data consistency
- **Redis caching** for performance
- **New Relic monitoring** integration
- **JWT authentication** with idempotency support
- **Socket.IO** for real-time updates
- **Comprehensive API documentation**

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## 🛠️ Setup

### 1. Clone and Install

```bash
cd Backend
npm install
```

### 2. Environment Configuration

Create a `.env` file (use `.env.example` as template):

```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://gocomet:gocomet123@localhost:5432/gocomet_daw?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Google Maps API
GOOGLE_MAPS_API=your-google-maps-api-key

# New Relic (optional)
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
NEW_RELIC_APP_NAME=GoComet DAW
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start Services

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Manual Start**
```bash
# Start PostgreSQL and Redis separately, then:
npm run dev
```

## 📡 API Endpoints

### Core v1 APIs

#### Create Ride Request
```http
POST /v1/rides
Authorization: Bearer <token>
Content-Type: application/json

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

#### Get Ride Status
```http
GET /v1/rides/:id
Authorization: Bearer <token>
```

#### Update Driver Location
```http
POST /v1/drivers/:id/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Accept Ride
```http
POST /v1/drivers/:id/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "ride-123"
}
```

#### End Trip
```http
POST /v1/trips/:id/end
Authorization: Bearer <token>
```

#### Process Payment
```http
POST /v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "tripId": "trip-123",
  "paymentMethod": "credit_card"
}
```

### Health Check
```http
GET /health
```

## 🔐 Authentication

All v1 APIs require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained from user/driver login endpoints (legacy routes).

## 🔄 Idempotency

POST/PUT requests support idempotency keys:

```http
Idempotency-Key: <uuid>
```

Duplicate requests with the same key return cached response.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Watch mode
npm run test:watch
```

## 📊 Monitoring

### New Relic Setup

New Relic is configured with the following credentials:
- **App Name**: `Anuj2`
- **License Key**: `7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL`

#### Quick Start (CommonJS - Current)

**Using npm script:**
```bash
npm run start:newrelic
```

**Using .env file:**
1. Copy `.env.example` to `.env`
2. The `.env` file already contains the New Relic credentials
3. Run: `npm start`

**Direct command:**
```bash
NEW_RELIC_APP_NAME=Anuj2 NEW_RELIC_LICENSE_KEY=7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL node -r newrelic server.js
```

#### ECMAScript Modules (ESM) Setup

If using ESM, add `import 'newrelic';` as the first line in `server.js` and use:

**Node.js < 20.9:**
```bash
NEW_RELIC_APP_NAME=Anuj2 NEW_RELIC_LICENSE_KEY=7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL node --experimental-loader=newrelic/esm-loader.mjs server.js
```

**Node.js 20.9+:**
```bash
NEW_RELIC_APP_NAME=Anuj2 NEW_RELIC_LICENSE_KEY=7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL node --import=newrelic/esm-loader.mjs server.js
```

**Using npm script:**
```bash
npm run start:newrelic:esm
```

See [NEW_RELIC_SETUP.md](./NEW_RELIC_SETUP.md) for detailed instructions.

### Metrics Tracked
- API response times (p50, p95, p99)
- Database query performance
- Error rates and exceptions
- Throughput (requests per second)
- Slow transaction traces (> 500ms)
- Custom business metrics
- Redis cache performance
- Socket.IO connection metrics

### Dashboard
Access your New Relic dashboard at: https://one.newrelic.com/
Your application will appear as "Anuj2" in the Applications list.

## 🏗️ Architecture

See [docs/HLD.md](../docs/HLD.md) and [docs/LLD.md](../docs/LLD.md) for detailed architecture documentation.

## 🐳 Docker

### Build and Run
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f backend
```

### Stop Services
```bash
docker-compose down
```

## 📈 Performance

### Optimizations
- **Database Indexes:** All foreign keys and frequently queried fields indexed
- **Redis Caching:** Driver locations and nearby drivers cached
- **Connection Pooling:** Prisma connection pooling
- **Transaction Optimization:** Minimal transaction scope

### Benchmarks
- **Ride Creation:** < 200ms p95
- **Driver Matching:** < 1s p95
- **Location Updates:** < 50ms p95
- **Trip End:** < 300ms p95

## 🔧 Development

### Project Structure
```
Backend/
├── controllers/        # Request handlers
│   └── v1/            # v1 API controllers
├── routes/            # Route definitions
│   └── v1/            # v1 API routes
├── services/          # Business logic
├── models/            # Legacy MongoDB models
├── db/                # Database connections (Prisma, Redis)
├── middlewares/       # Express middlewares
├── utils/             # Utility functions
├── prisma/            # Prisma schema and migrations
├── tests/             # Test files
├── socket.js          # Socket.IO configuration
├── app.js             # Express app setup
└── server.js          # Server entry point
```

### Code Style
- ESLint configuration (if configured)
- Consistent error handling
- Comprehensive comments
- Modular architecture

## 🚨 Error Handling

All errors follow consistent format:
```json
{
  "message": "Human-readable error message",
  "error": "Detailed error (development only)"
}
```

## 📝 License

ISC

## 🤝 Contributing

1. Follow code style guidelines
2. Write tests for new features
3. Update documentation
4. Submit pull request

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for GoComet DAW**
