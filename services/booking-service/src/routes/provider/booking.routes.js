const express = require('express');
const router = express.Router();
const ProviderQueryController = require('../../controllers/provider/booking-query.provider.controller'); // Assumes constructor matches pattern
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { bookingIdSchema } = require('../../validators/booking.validator');

const queryController = new ProviderQueryController();

router.use(authenticate, authorize('PROVIDER'));

// High-Throughput Real-time Provider Query Feeds
router.get('/pending', queryController.getPendingAssignments);
router.get('/active', queryController.listCurrentJobs);
router.get('/history', queryController.listPastLogs);
router.get('/:id', validate({ params: bookingIdSchema }), queryController.getJobDetails);

module.exports = router;