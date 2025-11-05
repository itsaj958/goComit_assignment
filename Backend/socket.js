// Enhanced Socket.IO for real-time updates (GoComet DAW)
const socketIo = require('socket.io');
const prisma = require('./db/prisma');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const { cacheDriverLocation } = require('./db/redis');

let io;

/**
 * Initialize Socket.IO server with enhanced real-time features
 * Handles driver location updates (1-2 per second), ride notifications, and live tracking
 */
function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:5173',
                'http://localhost:5174'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Connection rate limiting map (prevent abuse)
    const connectionRateLimit = new Map();

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Rate limiting check
        const clientIp = socket.handshake.address;
        const now = Date.now();
        const clientConnections = connectionRateLimit.get(clientIp) || { count: 0, resetTime: now + 60000 };
        
        if (now > clientConnections.resetTime) {
            clientConnections.count = 0;
            clientConnections.resetTime = now + 60000;
        }
        
        if (clientConnections.count > 10) {
            socket.emit('error', { message: 'Too many connections' });
            socket.disconnect();
            return;
        }
        
        clientConnections.count++;
        connectionRateLimit.set(clientIp, clientConnections);

        /**
         * Join room - User or Driver connects
         * Updates socketId in database for targeted messaging
         */
        socket.on('join', async (data) => {
            try {
                const { userId, userType, email } = data || {};

                if (!userId || !userType) {
                    socket.emit('error', { message: 'Missing userId or userType' });
                    return;
                }

                if (userType === 'user') {
                    let result = await prisma.user.updateMany({
                        where: { id: userId },
                        data: { socketId: socket.id }
                    });
                    if (result.count === 0 && email) {
                        // Fallback: map by email when client only knows legacy ID
                        result = await prisma.user.updateMany({
                            where: { email },
                            data: { socketId: socket.id }
                        });
                    }
                    // Also update legacy Mongo user for legacy flows
                    try { await userModel.findByIdAndUpdate(userId, { socketId: socket.id }); } catch {}
                    if (result.count === 0) {
                        // Allow legacy-only installs to work using Mongo IDs
                        console.warn(`Join: Prisma user not found (id=${userId}), updated Mongo if exists`);
                    }
                    socket.join(`user:${userId}`);
                    socket.join('users');
                    console.log(`User ${userId} joined room`);
                } else if (userType === 'driver' || userType === 'captain') {
                    const result = await prisma.driver.updateMany({
                        where: { id: userId },
                        data: { socketId: socket.id }
                    });
                    // Also update legacy Mongo captain for legacy flows
                    try { await captainModel.findByIdAndUpdate(userId, { socketId: socket.id }); } catch {}
                    if (result.count === 0) {
                        console.warn(`Join: Prisma driver not found (id=${userId}), updated Mongo if exists`);
                    }
                    socket.join(`driver:${userId}`);
                    socket.join('drivers');
                    console.log(`Driver ${userId} joined room`);
                }
            } catch (error) {
                console.error('Join error:', error);
                socket.emit('error', { message: 'Failed to join' });
            }
        });

        /**
         * Update driver location (high frequency - 1-2 per second)
         * Optimized with Redis caching and batched database updates
         */
        socket.on('update-location-driver', async (data) => {
            try {
                const { driverId, latitude, longitude } = data;

                if (!driverId || latitude === undefined || longitude === undefined) {
                    return socket.emit('error', { message: 'Invalid location data' });
                }

                // Validate coordinates
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                    return socket.emit('error', { message: 'Invalid coordinates' });
                }

                // Cache in Redis immediately (fast)
                await cacheDriverLocation(driverId, latitude, longitude);

                // Update database (can be async/batched in production)
                await prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        latitude,
                        longitude,
                        updatedAt: new Date()
                    }
                }).catch(err => {
                    console.error('Location DB update error (non-critical):', err);
                });

                // Check if driver is on an active trip and notify rider
                const activeTrip = await prisma.trip.findFirst({
                    where: {
                        driverId,
                        status: 'ACTIVE'
                    },
                    include: {
                        ride: {
                            include: {
                                user: true
                            }
                        }
                    }
                });

                if (activeTrip && activeTrip.ride.user.socketId) {
                    // Broadcast location to rider
                    io.to(activeTrip.ride.user.socketId).emit('driver-location-update', {
                        driverId,
                        latitude,
                        longitude,
                        timestamp: Date.now()
                    });
                }

            } catch (error) {
                console.error('Location update error:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // Backward-compatibility: legacy frontend event name
        socket.on('update-location-captain', async (data) => {
            try {
                const { userId, location } = data || {};
                if (!userId || !location || location.ltd === undefined || location.lng === undefined) {
                    return socket.emit('error', { message: 'Invalid location data' });
                }
                // Update legacy Mongo captain location
                try {
                    await captainModel.findByIdAndUpdate(userId, {
                        location: { ltd: location.ltd, lng: location.lng }
                    });
                } catch {}
                // Also update Prisma driver if exists
                await prisma.driver.updateMany({
                    where: { id: userId },
                    data: { latitude: location.ltd, longitude: location.lng, updatedAt: new Date() }
                });

                // Broadcast availability to all users (lightweight)
                try {
                    io.to('users').emit('driver-available', {
                        driverId: userId,
                        latitude: location.ltd,
                        longitude: location.lng,
                        timestamp: Date.now()
                    });
                } catch {}
            } catch (error) {
                console.error('Legacy location update error:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        /**
         * Driver accepts ride
         */
        socket.on('ride-accepted', async (data) => {
            try {
                const { rideId, driverId } = data;
                // Notification handled by HTTP API, but can emit here too
                const ride = await prisma.ride.findUnique({
                    where: { id: rideId },
                    include: { user: true }
                });

                if (ride && ride.user.socketId) {
                    io.to(ride.user.socketId).emit('ride-accepted', {
                        rideId,
                        driverId,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.error('Ride accepted error:', error);
            }
        });

        /**
         * Disconnect handler
         */
        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            
            // Clean up socketId from database
            try {
                await prisma.user.updateMany({
                    where: { socketId: socket.id },
                    data: { socketId: null }
                });
                await prisma.driver.updateMany({
                    where: { socketId: socket.id },
                    data: { socketId: null }
                });
            } catch (error) {
                console.error('Disconnect cleanup error:', error);
            }
        });

        /**
         * Error handler
         */
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
}

/**
 * Send message to specific socket ID
 * Used for targeted notifications
 */
const sendMessageToSocketId = (socketId, messageObject) => {
    if (!socketId) {
        console.warn('No socketId provided for message');
        return;
    }

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.warn('Socket.io not initialized.');
    }
};

/**
 * Broadcast to all drivers in a room
 */
const broadcastToDrivers = (event, data) => {
    if (io) {
        io.to('drivers').emit(event, data);
    }
};

/**
 * Broadcast to all users in a room
 */
const broadcastToUsers = (event, data) => {
    if (io) {
        io.to('users').emit(event, data);
    }
};

module.exports = { 
    initializeSocket, 
    sendMessageToSocketId,
    broadcastToDrivers,
    broadcastToUsers
};