// v1 Authentication middleware using Prisma
const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');
const { getIdempotencyKey } = require('../db/redis');

/**
 * User authentication middleware
 * Verifies JWT token and loads user from database
 */
module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    // Check if token is blacklisted (in Redis or DB)
    const isBlacklisted = await getIdempotencyKey(`blacklist:token:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Unauthorized - Token blacklisted' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Load user from database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        socketId: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }

    req.user = user;
    return next();

  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};

/**
 * Driver authentication middleware
 * Verifies JWT token and loads driver from database
 */
module.exports.authDriver = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await getIdempotencyKey(`blacklist:token:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Unauthorized - Token blacklisted' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Load driver from database using Prisma
    const driver = await prisma.driver.findUnique({
      where: { id: decoded.id || decoded.driverId },
      include: {
        vehicle: true
      }
    });

    if (!driver) {
      return res.status(401).json({ message: 'Unauthorized - Driver not found' });
    }

    req.driver = driver;
    return next();

  } catch (err) {
    console.error('Driver auth error:', err);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};

