const express = require('express');
const router = express.Router();

const customerRoutes = require('./customer.routes');
const providerRoutes = require('./provider.routes');

// Segment endpoint access paths by tenant type
router.use('/bookings/customer', customerRoutes);
router.use('/bookings/provider', providerRoutes);

module.exports = router;