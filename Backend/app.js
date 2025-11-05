// Load New Relic monitoring first (before other modules)
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('./config/newrelic');
}

const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const cookieParser = require('cookie-parser');
const { connectRedis } = require('./db/redis');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Legacy MongoDB connection (for backward compatibility)
const connectToDb = require('./db/db');
connectToDb();

// Connect to Redis
connectRedis().catch(err => {
  console.error('Failed to connect to Redis:', err);
  // Continue without Redis in development
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173' , 'http://localhost:5174'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting to all routes
app.use('/v1', apiLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GoComet DAW Backend',
    version: '2.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'GoComet DAW API',
    version: '2.0.0',
    endpoints: {
      v1: '/v1',
      health: '/health'
    }
  });
});

// Legacy routes (for backward compatibility)
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

// New v1 API routes
const v1Routes = require('./routes/v1');
app.use('/v1', v1Routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;

