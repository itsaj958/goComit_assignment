const axios = require('axios');
const captainModel = require('../models/captain.model');
const { getRedisClient } = require('../db/redis');

const mapsAxios = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api',
    timeout: 7000, // 7s network timeout
});

const RETRIABLE_ERROR_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
]);

async function getWithRetries(url, maxRetries = 2) {
    let attempt = 0;
    // Simple jittered backoff: 300ms, 700ms
    while (true) {
        try {
            return await mapsAxios.get(url, {
                headers: { 'Accept-Encoding': 'identity' }, // avoid compression edge-cases
                validateStatus: (s) => s >= 200 && s < 500,
            });
        } catch (err) {
            const code = err?.code;
            if (attempt < maxRetries && RETRIABLE_ERROR_CODES.has(code)) {
                const delay = 300 + attempt * 400;
                await new Promise(r => setTimeout(r, delay));
                attempt++;
                continue;
            }
            throw err;
        }
    }
}

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = process.env.GOOGLE_MAPS_API;
    if (!apiKey) {
        throw new Error('Google Maps API key missing. Set GOOGLE_MAPS_API in Backend/.env');
    }
    const url = `/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await getWithRetries(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else {
            throw new Error(`Unable to fetch coordinates: ${response.data.status}`);
        }
    } catch (error) {
        console.error('Geocode error:', error?.code || error?.message || error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;
    if (!apiKey) {
        throw new Error('Google Maps API key missing. Set GOOGLE_MAPS_API in Backend/.env');
    }
    const url = `/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    // Short-lived cache in Redis to avoid repeated Distance Matrix calls
    const redis = getRedisClient && getRedisClient();
    const cacheKey = `maps:dist:${origin}:${destination}`;
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            // Non-fatal: proceed without cache
        }
    }

    try {
        const response = await getWithRetries(url);
        if (response.data.status === 'OK') {
            if (response.data.rows[0].elements[0].status === 'ZERO_RESULTS') {
                throw new Error('No routes found');
            }

            const result = response.data.rows[0].elements[0];
            if (redis) {
                try {
                    // Cache for 60 seconds; adequate for repeated quick retries
                    await redis.setEx(cacheKey, 60, JSON.stringify(result));
                } catch (e) {
                    // ignore cache write errors
                }
            }
            return result;
        } else {
            throw new Error(`Unable to fetch distance and time: ${response.data.status}`);
        }
    } catch (err) {
        console.error('DistanceMatrix error:', err?.code || err?.message || err);
        throw err;
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;
    if (!apiKey) {
        throw new Error('Google Maps API key missing. Set GOOGLE_MAPS_API in Backend/.env');
    }
    const url = `/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    try {
        const response = await getWithRetries(url);
        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else {
            throw new Error(`Unable to fetch suggestions: ${response.data.status}`);
        }
    } catch (err) {
        console.error('Places Autocomplete error:', err?.code || err?.message || err);
        // Fail gracefully to avoid blocking UX on transient network hiccups
        return [];
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radiusKm) => {
    // Fallback implementation using Haversine distance with stored ltd/lng fields
    const captains = await captainModel.find({
        socketId: { $exists: true, $ne: null },
        'location.ltd': { $exists: true },
        'location.lng': { $exists: true }
    });

    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // km

    const isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d <= radiusKm;
    };

    return captains.filter(c => {
        const lat = c.location?.ltd;
        const lon = c.location?.lng;
        if (lat === undefined || lon === undefined) return false;
        return isWithinRadius(ltd, lng, lat, lon, radiusKm);
    });
}