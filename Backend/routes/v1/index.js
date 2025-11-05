// v1 API routes aggregation
const express = require('express');
const router = express.Router();

const ridesRoutes = require('./rides.routes');
const driversRoutes = require('./drivers.routes');
const tripsRoutes = require('./trips.routes');
const paymentsRoutes = require('./payments.routes');

// Mount all v1 routes
router.use('/rides', ridesRoutes);
router.use('/drivers', driversRoutes);
router.use('/trips', tripsRoutes);
router.use('/payments', paymentsRoutes);

module.exports = router;

