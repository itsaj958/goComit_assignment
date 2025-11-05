// Idempotency middleware and utilities
// Ensures API requests can be safely retried without side effects

const { getIdempotencyKey, setIdempotencyKey } = require('../db/redis');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate or extract idempotency key from request
 */
function getIdempotencyKeyFromRequest(req) {
  // Check header first (standard practice)
  const headerKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (headerKey) {
    return headerKey;
  }
  
  // Fallback to body if present
  if (req.body && req.body.idempotencyKey) {
    return req.body.idempotencyKey;
  }
  
  return null;
}

/**
 * Middleware to handle idempotency for POST/PUT requests
 */
async function idempotencyMiddleware(req, res, next) {
  // Only apply to state-changing methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = getIdempotencyKeyFromRequest(req);
  
  if (!idempotencyKey) {
    // Generate one if not provided (optional - can enforce client to provide)
    req.idempotencyKey = uuidv4();
    return next();
  }

  req.idempotencyKey = idempotencyKey;

  // Check if we've seen this key before
  const cachedResponse = await getIdempotencyKey(idempotencyKey);
  
  if (cachedResponse) {
    // Return cached response
    return res.status(cachedResponse.statusCode).json(cachedResponse.body);
  }

  // Store original json method to capture response
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    // Cache the response for idempotency
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setIdempotencyKey(idempotencyKey, {
        statusCode: res.statusCode,
        body: body
      }, 86400); // 24 hours
    }
    return originalJson(body);
  };

  next();
}

module.exports = {
  getIdempotencyKeyFromRequest,
  idempotencyMiddleware,
};

