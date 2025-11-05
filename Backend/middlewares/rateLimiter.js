// Rate limiting middleware for API endpoints
const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for location updates
 * 200 requests per minute (allows 1-2 updates per second)
 */
const locationUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Allow high frequency updates
  message: {
    error: 'Too many location updates, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for ride creation
 * 10 requests per minute per IP
 */
const rideCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Too many ride requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  locationUpdateLimiter,
  rideCreationLimiter,
  authLimiter
};


